import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  fetchAllPlayoffStats,
  parsePlayerStats,
  parseDefenseStats,
  calculateTotalPoints,
} from "@/lib/espn";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for this endpoint

/**
 * POST /api/sync
 * Sync scores from ESPN to the database
 * Body:
 *   - year: number (default: current year)
 *   - weeks: number[] (default: [1, 2, 3, 5])
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const year = body.year ?? new Date().getFullYear();
    const weeks: number[] = body.weeks ?? [1, 2, 3, 5];

    const results = {
      playersUpdated: 0,
      scoresCreated: 0,
      scoresUpdated: 0,
      errors: [] as string[],
    };

    // Fetch all games
    const allGames = await fetchAllPlayoffStats(weeks);

    // Process each game
    for (const { week, summary } of allGames) {
      // Parse player stats
      const playerStats = parsePlayerStats(summary);
      calculateTotalPoints(playerStats);

      // Parse defense stats
      const defenseStats = parseDefenseStats(summary);

      // Update player scores
      for (const [, player] of playerStats) {
        try {
          // Find or create player
          const dbPlayer = await prisma.player.upsert({
            where: {
              name_position: {
                name: player.name,
                position: "QB", // Default, will be updated
              },
            },
            create: {
              name: player.name,
              position: "QB", // Will need position detection logic
              espnId: player.espnId,
            },
            update: {
              espnId: player.espnId,
            },
          });

          // Upsert score for this week
          await prisma.playerScore.upsert({
            where: {
              playerId_week_year: {
                playerId: dbPlayer.id,
                week,
                year,
              },
            },
            create: {
              playerId: dbPlayer.id,
              week,
              year,
              points: player.totalPoints,
              breakdown: player.stats,
            },
            update: {
              points: player.totalPoints,
              breakdown: player.stats,
            },
          });

          results.scoresUpdated++;
        } catch (error) {
          results.errors.push(
            `Failed to update ${player.name}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Update defense scores
      for (const [key, defense] of defenseStats) {
        // Only process the "TEAM DST" format entries
        if (!key.includes("dst")) continue;

        try {
          const dbPlayer = await prisma.player.upsert({
            where: {
              name_position: {
                name: `${defense.abbreviation} DST`,
                position: "DST",
              },
            },
            create: {
              name: `${defense.abbreviation} DST`,
              position: "DST",
              team: defense.abbreviation,
            },
            update: {},
          });

          await prisma.playerScore.upsert({
            where: {
              playerId_week_year: {
                playerId: dbPlayer.id,
                week,
                year,
              },
            },
            create: {
              playerId: dbPlayer.id,
              week,
              year,
              points: defense.totalPoints,
              breakdown: defense.stats,
            },
            update: {
              points: defense.totalPoints,
              breakdown: defense.stats,
            },
          });

          results.scoresUpdated++;
        } catch (error) {
          results.errors.push(
            `Failed to update ${defense.teamName} DST: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        year,
        weeks,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error syncing scores:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync scores",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
