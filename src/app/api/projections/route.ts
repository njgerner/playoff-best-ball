import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * GET /api/projections
 * Get player projections with expected values
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get("year") || String(CURRENT_SEASON_YEAR));
    const week = url.searchParams.get("week") ? parseInt(url.searchParams.get("week")!) : undefined;

    // Get all owners with their rosters, player scores, and projections
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
                  where: week ? { year, week } : { year },
                  orderBy: { week: "asc" },
                },
              },
            },
          },
        },
      },
    });

    // Get team odds for this week
    const teamOdds = await prisma.teamOdds.findMany({
      where: week ? { year, week } : { year },
    });
    const oddsMap = new Map(teamOdds.map((o) => [o.team, o]));

    // Transform data for projection view
    const projections = owners.map((owner) => {
      const players = owner.rosters.map((roster) => {
        const actualPoints = roster.player.scores.reduce((sum, s) => sum + s.points, 0);
        const playerTeam = (roster.player.team || "").toUpperCase();
        const teamOdd = oddsMap.get(playerTeam);

        // Get projection for this player (latest week if not specified)
        const playerProjections = roster.player.projections;
        const latestProjection =
          playerProjections.length > 0 ? playerProjections[playerProjections.length - 1] : null;

        return {
          id: roster.player.id,
          name: roster.player.name,
          position: roster.player.position,
          team: roster.player.team,
          slot: roster.rosterSlot,
          actualPoints,
          projectedPoints: latestProjection?.projectedPoints || 0,
          teamWinProb: teamOdd?.winProb || latestProjection?.teamWinProb || null,
          expectedValue: latestProjection?.expectedValue || null,
          opponent: teamOdd?.opponent || null,
          source: latestProjection?.source || null,
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
        totalExpectedValue: totalActual + totalEV, // Actual + remaining EV
      };
    });

    // Sort by total expected value
    projections.sort((a, b) => b.totalExpectedValue - a.totalExpectedValue);

    return NextResponse.json({
      projections,
      week,
      year,
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
