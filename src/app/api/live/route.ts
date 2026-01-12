import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";
import { getEliminatedTeams } from "@/lib/espn/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/live
 * Get current roster scores from the database for live display
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get("year") || String(CURRENT_SEASON_YEAR));

    // Get eliminated teams
    const eliminatedTeams = await getEliminatedTeams();

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

    // Transform data for the live view
    const rosters = owners.map((owner) => {
      const players = owner.rosters.map((roster) => {
        const totalPoints = roster.player.scores.reduce((sum, s) => sum + s.points, 0);
        const playerTeam = (roster.player.team || "").toUpperCase();
        return {
          id: roster.player.id,
          name: roster.player.name,
          position: roster.player.position,
          team: roster.player.team,
          slot: roster.rosterSlot,
          points: totalPoints,
          isEliminated: eliminatedTeams.has(playerTeam),
          weeklyScores: roster.player.scores.map((s) => ({
            week: s.week,
            points: s.points,
          })),
        };
      });

      // Sort players by slot order
      const slotOrder = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "K", "DST"];
      players.sort((a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot));

      const totalPoints = players.reduce((sum, p) => sum + p.points, 0);
      const activePlayers = players.filter((p) => !p.isEliminated).length;

      return {
        ownerId: owner.id,
        ownerName: owner.name,
        players,
        totalPoints,
        activePlayers,
      };
    });

    // Determine current week based on which weeks have scores
    const allWeeks = new Set<number>();
    owners.forEach((owner) => {
      owner.rosters.forEach((roster) => {
        roster.player.scores.forEach((score) => {
          allWeeks.add(score.week);
        });
      });
    });
    const currentWeek = Math.max(...Array.from(allWeeks), 1);

    return NextResponse.json({
      rosters,
      eliminatedTeams: Array.from(eliminatedTeams),
      lastUpdated: new Date().toISOString(),
      week: currentWeek,
      year,
    });
  } catch (error) {
    console.error("Error fetching live scores:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch live scores",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
