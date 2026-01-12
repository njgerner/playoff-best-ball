import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";
import { getEliminatedTeams } from "@/lib/espn/client";

export const dynamic = "force-dynamic";

// Playoff weeks: 1=Wild Card, 2=Divisional, 3=Conference, 5=Super Bowl
const PLAYOFF_WEEKS = [1, 2, 3, 5];

interface WeekProjection {
  week: number;
  weekName: string;
  projectedPoints: number;
  advanceProb: number;
  expectedValue: number;
}

interface PlayerPlayoffProjection {
  id: string;
  name: string;
  position: string;
  team: string | null;
  slot: string;
  actualPoints: number;
  avgPointsPerGame: number;
  gamesPlayed: number;
  weeklyBreakdown: WeekProjection[];
  totalRemainingEV: number;
  champProb: number | null;
}

interface OwnerPlayoffProjection {
  ownerId: string;
  ownerName: string;
  players: PlayerPlayoffProjection[];
  actualPoints: number;
  totalRemainingEV: number;
  totalProjectedPoints: number;
  activePlayers: number;
  eliminatedPlayers: number;
}

/**
 * GET /api/projections/playoffs
 * Get cumulative rest-of-playoffs projections for all owners
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get("year") || String(CURRENT_SEASON_YEAR));

    // Get eliminated teams
    const eliminatedTeams = await getEliminatedTeams();

    // Determine current/completed weeks based on scores
    const scoresWithWeeks = await prisma.playerScore.findMany({
      where: { year },
      select: { week: true },
      distinct: ["week"],
    });
    const completedWeeks = scoresWithWeeks.map((s) => s.week);
    const remainingWeeks = PLAYOFF_WEEKS.filter((w) => !completedWeeks.includes(w));
    const currentWeek = remainingWeeks.length > 0 ? remainingWeeks[0] : 5;

    // Get all team odds for remaining weeks
    const allOdds = await prisma.teamOdds.findMany({
      where: { year, week: { in: remainingWeeks } },
    });

    // Build odds map: team -> week -> winProb
    const oddsMap = new Map<string, Map<number, number>>();
    for (const odd of allOdds) {
      if (!oddsMap.has(odd.team)) {
        oddsMap.set(odd.team, new Map());
      }
      oddsMap.get(odd.team)!.set(odd.week, odd.winProb);
    }

    // Get all owners with rosters, scores, and projections
    const owners = await prisma.owner.findMany({
      include: {
        rosters: {
          where: { year },
          include: {
            player: {
              include: {
                scores: {
                  where: { year },
                  orderBy: { week: "asc" },
                },
                projections: {
                  where: { year },
                },
              },
            },
          },
        },
      },
    });

    const weekNames: Record<number, string> = {
      1: "Wild Card",
      2: "Divisional",
      3: "Conference",
      5: "Super Bowl",
    };

    // Calculate projections for each owner
    const projections: OwnerPlayoffProjection[] = owners.map((owner) => {
      let ownerTotalEV = 0;
      let ownerTotalProjected = 0;
      let activePlayers = 0;
      let eliminatedPlayers = 0;

      const players: PlayerPlayoffProjection[] = owner.rosters.map((roster) => {
        const player = roster.player;
        const playerTeam = (player.team || "").toUpperCase();
        const isEliminated = eliminatedTeams.has(playerTeam);

        if (isEliminated) {
          eliminatedPlayers++;
        } else {
          activePlayers++;
        }

        // Calculate actual points and average
        const actualPoints = player.scores.reduce((sum, s) => sum + s.points, 0);
        const gamesPlayed = player.scores.filter((s) => s.points > 0).length;
        const avgPointsPerGame =
          gamesPlayed > 0 ? actualPoints / gamesPlayed : getPositionAverage(player.position);

        // Calculate week-by-week EV for remaining weeks
        const weeklyBreakdown: WeekProjection[] = [];
        let totalRemainingEV = 0;
        let cumulativeAdvanceProb = 1;

        if (!isEliminated && playerTeam) {
          const teamOdds = oddsMap.get(playerTeam);

          for (const week of remainingWeeks) {
            // Get win probability for this week
            // If no odds, estimate based on remaining teams (assume equal chance)
            const weekWinProb = teamOdds?.get(week) ?? 0.5;

            // Advance probability is cumulative (must win all previous games)
            const advanceProb = cumulativeAdvanceProb * weekWinProb;
            const weekEV = avgPointsPerGame * advanceProb;

            weeklyBreakdown.push({
              week,
              weekName: weekNames[week],
              projectedPoints: avgPointsPerGame,
              advanceProb,
              expectedValue: Math.round(weekEV * 100) / 100,
            });

            totalRemainingEV += weekEV;
            cumulativeAdvanceProb = advanceProb; // Update for next round
          }
        }

        ownerTotalEV += totalRemainingEV;
        ownerTotalProjected += avgPointsPerGame * remainingWeeks.length;

        // Championship probability (probability of making Super Bowl)
        const champProb =
          !isEliminated && weeklyBreakdown.length > 0
            ? (weeklyBreakdown[weeklyBreakdown.length - 1]?.advanceProb ?? null)
            : null;

        return {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          slot: roster.rosterSlot,
          actualPoints,
          avgPointsPerGame: Math.round(avgPointsPerGame * 100) / 100,
          gamesPlayed,
          weeklyBreakdown,
          totalRemainingEV: Math.round(totalRemainingEV * 100) / 100,
          champProb: champProb ? Math.round(champProb * 1000) / 1000 : null,
        };
      });

      // Sort players by total remaining EV
      players.sort((a, b) => b.totalRemainingEV - a.totalRemainingEV);

      const actualPoints = players.reduce((sum, p) => sum + p.actualPoints, 0);

      return {
        ownerId: owner.id,
        ownerName: owner.name,
        players,
        actualPoints,
        totalRemainingEV: Math.round(ownerTotalEV * 100) / 100,
        totalProjectedPoints: Math.round(ownerTotalProjected * 100) / 100,
        activePlayers,
        eliminatedPlayers,
      };
    });

    // Sort owners by total expected value (actual + remaining EV)
    projections.sort(
      (a, b) => b.actualPoints + b.totalRemainingEV - (a.actualPoints + a.totalRemainingEV)
    );

    return NextResponse.json({
      projections,
      completedWeeks,
      remainingWeeks,
      currentWeek,
      year,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching playoff projections:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch playoff projections",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Position averages for players with no games played
function getPositionAverage(position: string): number {
  const averages: Record<string, number> = {
    QB: 18.5,
    RB: 12.0,
    WR: 11.5,
    TE: 8.0,
    K: 7.5,
    DST: 7.0,
  };
  return averages[position] ?? 10;
}
