import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CURRENT_SEASON_YEAR, BYE_TEAMS_2025 } from "@/lib/constants";
import { getEliminatedTeams } from "@/lib/espn/client";

export const dynamic = "force-dynamic";

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

/**
 * GET /api/projections
 * Get player projections with expected values for a single week
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get("year") || String(CURRENT_SEASON_YEAR));
    const week = url.searchParams.get("week") ? parseInt(url.searchParams.get("week")!) : 1;

    // Get eliminated teams
    const eliminatedTeams = await getEliminatedTeams();
    const byeTeams = new Set(BYE_TEAMS_2025);

    // Get all owners with their rosters and player scores
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
              },
            },
          },
        },
      },
    });

    // Get team odds for this week (filtering out bye teams for Wild Card)
    const teamOdds = await prisma.teamOdds.findMany({
      where: { year, week },
    });

    // Filter odds: in Wild Card, bye teams don't play (and games against bye teams aren't WC games)
    const filteredOdds =
      week === 1
        ? teamOdds.filter((o) => !byeTeams.has(o.team) && !byeTeams.has(o.opponent))
        : teamOdds;

    const oddsMap = new Map(filteredOdds.map((o) => [o.team, o]));

    // Transform data for projection view
    const projections = owners.map((owner) => {
      const players = owner.rosters.map((roster) => {
        const actualPoints = roster.player.scores.reduce((sum, s) => sum + s.points, 0);
        const playerTeam = (roster.player.team || "").toUpperCase();
        const teamOdd = oddsMap.get(playerTeam);
        const isEliminated = eliminatedTeams.has(playerTeam);
        const hasBye = byeTeams.has(playerTeam);

        // Calculate projected points from playoff average
        const gamesPlayed = roster.player.scores.filter((s) => s.points > 0).length;
        const avgPointsPerGame =
          gamesPlayed > 0 ? actualPoints / gamesPlayed : getPositionAverage(roster.player.position);
        const projectedPoints = Math.round(avgPointsPerGame * 100) / 100;

        // Calculate expected value
        let expectedValue: number | null = null;
        let winProb: number | null = null;
        const opponent: string | null = teamOdd?.opponent || null;
        let isByeWeek = false;

        if (isEliminated) {
          // Eliminated teams have no EV
          expectedValue = null;
        } else if (week === 1 && hasBye) {
          // Bye teams don't play Wild Card - show as BYE
          expectedValue = null;
          isByeWeek = true;
        } else if (teamOdd) {
          // Has odds for this week
          winProb = teamOdd.winProb;
          expectedValue = Math.round(projectedPoints * winProb * 100) / 100;
        } else if (!hasBye || week > 1) {
          // No odds but not eliminated - use 50% default
          winProb = 0.5;
          expectedValue = Math.round(projectedPoints * 0.5 * 100) / 100;
        }

        return {
          id: roster.player.id,
          name: roster.player.name,
          position: roster.player.position,
          team: roster.player.team,
          slot: roster.rosterSlot,
          actualPoints,
          projectedPoints,
          teamWinProb: winProb,
          expectedValue,
          opponent,
          isEliminated,
          isByeWeek,
          weeklyScores: roster.player.scores.map((s) => ({
            week: s.week,
            points: s.points,
          })),
        };
      });

      // Sort players by slot order
      const slotOrder = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "K", "DST"];
      players.sort((a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot));

      const totalActual = players.reduce((sum, p) => sum + p.actualPoints, 0);
      const totalProjected = players.reduce((sum, p) => sum + p.projectedPoints, 0);
      const totalEV = players.reduce((sum, p) => sum + (p.expectedValue || 0), 0);

      return {
        ownerId: owner.id,
        ownerName: owner.name,
        players,
        actualPoints: totalActual,
        projectedPoints: totalProjected,
        expectedValue: totalEV,
        totalExpectedValue: totalActual + totalEV,
      };
    });

    // Sort by total expected value
    projections.sort((a, b) => b.totalExpectedValue - a.totalExpectedValue);

    return NextResponse.json({
      projections,
      week,
      year,
      byeTeams: Array.from(byeTeams),
      eliminatedTeams: Array.from(eliminatedTeams),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching projections:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch projections",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
