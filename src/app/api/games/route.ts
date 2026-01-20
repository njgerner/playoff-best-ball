import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { fetchScoreboard, fetchGameSummary, getEliminatedTeams } from "@/lib/espn/client";
import { parsePlayerStats, parseDefenseStats, calculateTotalPoints } from "@/lib/espn";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";
import { GamePlayer, PlayoffGame } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/games
 * Fetch current playoff games with player stats for players on fantasy rosters
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get("year") || String(CURRENT_SEASON_YEAR));
    const week = parseInt(url.searchParams.get("week") || "1");

    // Get eliminated teams based on completed playoff games
    const eliminatedTeams = await getEliminatedTeams();

    // Get all rostered players with their owners and substitutions
    const rosters = await prisma.roster.findMany({
      where: { year },
      include: {
        player: true,
        owner: true,
        substitutions: {
          where: { year },
          include: {
            substitutePlayer: true,
          },
        },
      },
    });

    // Create a map of player names to roster info for quick lookup
    const playerRosterMap = new Map<
      string,
      {
        playerId: string;
        ownerId: string;
        ownerName: string;
        rosterSlot: string;
        position: string;
        team: string | null;
        hasSubstitution: boolean;
        substitution: {
          effectiveWeek: number;
          reason: string | null;
          substitutePlayer: {
            id: string;
            name: string;
            team: string | null;
          };
        } | null;
      }
    >();

    // Also create a map for substitute players
    const substitutePlayerMap = new Map<
      string,
      {
        playerId: string;
        ownerId: string;
        ownerName: string;
        rosterSlot: string;
        position: string;
        team: string | null;
        isSubstitute: true;
        originalPlayer: {
          id: string;
          name: string;
          team: string | null;
        };
        effectiveWeek: number;
      }
    >();

    for (const roster of rosters) {
      const substitution = roster.substitutions[0]; // At most one per roster per year
      const hasSubstitution = !!substitution;

      const normalizedName = roster.player.name.toLowerCase().trim();
      playerRosterMap.set(normalizedName, {
        playerId: roster.player.id,
        ownerId: roster.owner.id,
        ownerName: roster.owner.name,
        rosterSlot: roster.rosterSlot,
        position: roster.player.position,
        team: roster.player.team,
        hasSubstitution,
        substitution: hasSubstitution
          ? {
              effectiveWeek: substitution.effectiveWeek,
              reason: substitution.reason,
              substitutePlayer: {
                id: substitution.substitutePlayer.id,
                name: substitution.substitutePlayer.name,
                team: substitution.substitutePlayer.team,
              },
            }
          : null,
      });

      // Add substitute player to the map too
      if (hasSubstitution) {
        const subNormalizedName = substitution.substitutePlayer.name.toLowerCase().trim();
        substitutePlayerMap.set(subNormalizedName, {
          playerId: substitution.substitutePlayer.id,
          ownerId: roster.owner.id,
          ownerName: roster.owner.name,
          rosterSlot: roster.rosterSlot,
          position: substitution.substitutePlayer.position,
          team: substitution.substitutePlayer.team,
          isSubstitute: true,
          originalPlayer: {
            id: roster.player.id,
            name: roster.player.name,
            team: roster.player.team,
          },
          effectiveWeek: substitution.effectiveWeek,
        });
      }
    }

    // Also create a map for DST matching by team abbreviation
    const dstRosterMap = new Map<
      string,
      { playerId: string; ownerId: string; ownerName: string; rosterSlot: string }
    >();
    for (const roster of rosters) {
      if (roster.player.position === "DST" && roster.player.team) {
        dstRosterMap.set(roster.player.team.toUpperCase(), {
          playerId: roster.player.id,
          ownerId: roster.owner.id,
          ownerName: roster.owner.name,
          rosterSlot: roster.rosterSlot,
        });
      }
    }

    // Fetch games for the specified week
    const events = await fetchScoreboard(week);
    const games: PlayoffGame[] = [];

    for (const event of events) {
      // Skip Pro Bowl
      if (event.name.toLowerCase().includes("pro bowl")) continue;

      const competition = event.competitions[0];
      if (!competition) continue;

      const homeCompetitor = competition.competitors.find((c) => c.homeAway === "home");
      const awayCompetitor = competition.competitors.find((c) => c.homeAway === "away");

      if (!homeCompetitor || !awayCompetitor) continue;

      const gameInfo: PlayoffGame = {
        eventId: event.id,
        week,
        name: event.name,
        shortName:
          event.shortName ||
          `${awayCompetitor.team.abbreviation} @ ${homeCompetitor.team.abbreviation}`,
        date: event.date,
        status: {
          state: event.status.type.state as "pre" | "in" | "post",
          completed: event.status.type.completed,
          description: event.status.type.description,
          detail: event.status.type.detail,
          displayClock: event.status.displayClock,
          period: event.status.period,
        },
        homeTeam: {
          abbreviation: homeCompetitor.team.abbreviation,
          displayName: homeCompetitor.team.displayName,
          score: parseInt(homeCompetitor.score) || 0,
        },
        awayTeam: {
          abbreviation: awayCompetitor.team.abbreviation,
          displayName: awayCompetitor.team.displayName,
          score: parseInt(awayCompetitor.score) || 0,
        },
        players: [],
      };

      // Only fetch detailed stats for games that have started
      if (event.status.type.state !== "pre") {
        const summary = await fetchGameSummary(event.id);
        if (summary) {
          // Parse player stats
          const playerStats = parsePlayerStats(summary);
          calculateTotalPoints(playerStats);

          // Parse defense stats
          const defenseStats = parseDefenseStats(summary);

          // Match ESPN players to our roster
          for (const [, player] of playerStats) {
            const normalizedName = player.name.toLowerCase().trim();
            const rosterInfo = playerRosterMap.get(normalizedName);
            const subInfo = substitutePlayerMap.get(normalizedName);

            if (rosterInfo) {
              const playerTeam = (player.team || rosterInfo.team || "").toUpperCase();
              // Check if this original player is injured and week >= effectiveWeek
              const isInjured =
                rosterInfo.hasSubstitution && week >= rosterInfo.substitution!.effectiveWeek;

              gameInfo.players.push({
                playerId: rosterInfo.playerId,
                playerName: player.name,
                position: rosterInfo.position,
                team: player.team || "",
                ownerId: rosterInfo.ownerId,
                ownerName: rosterInfo.ownerName,
                rosterSlot: rosterInfo.rosterSlot,
                isEliminated: eliminatedTeams.has(playerTeam),
                stats: {
                  passYards: player.stats.passYards || undefined,
                  passTd: player.stats.passTd || undefined,
                  passInt: player.stats.passInt || undefined,
                  rushYards: player.stats.rushYards || undefined,
                  rushTd: player.stats.rushTd || undefined,
                  recYards: player.stats.recYards || undefined,
                  recTd: player.stats.recTd || undefined,
                  receptions: player.stats.receptions || undefined,
                  fumblesLost: player.stats.fumblesLost || undefined,
                },
                points: player.totalPoints,
                // Substitution info
                hasSubstitution: rosterInfo.hasSubstitution,
                isInjured,
                substitution: rosterInfo.substitution,
              });
            } else if (subInfo && week >= subInfo.effectiveWeek) {
              // This is a substitute player and we're in an active week for them
              const playerTeam = (player.team || subInfo.team || "").toUpperCase();
              gameInfo.players.push({
                playerId: subInfo.playerId,
                playerName: player.name,
                position: subInfo.position,
                team: player.team || "",
                ownerId: subInfo.ownerId,
                ownerName: subInfo.ownerName,
                rosterSlot: subInfo.rosterSlot,
                isEliminated: eliminatedTeams.has(playerTeam),
                stats: {
                  passYards: player.stats.passYards || undefined,
                  passTd: player.stats.passTd || undefined,
                  passInt: player.stats.passInt || undefined,
                  rushYards: player.stats.rushYards || undefined,
                  rushTd: player.stats.rushTd || undefined,
                  recYards: player.stats.recYards || undefined,
                  recTd: player.stats.recTd || undefined,
                  receptions: player.stats.receptions || undefined,
                  fumblesLost: player.stats.fumblesLost || undefined,
                },
                points: player.totalPoints,
                // Mark as substitute
                isSubstitute: true,
                originalPlayer: subInfo.originalPlayer,
              });
            }
          }

          // Match defense stats
          for (const [key, defense] of defenseStats) {
            if (!key.includes("dst")) continue;

            const rosterInfo = dstRosterMap.get(defense.abbreviation.toUpperCase());
            if (rosterInfo) {
              gameInfo.players.push({
                playerId: rosterInfo.playerId,
                playerName: `${defense.teamName} DST`,
                position: "DST",
                team: defense.abbreviation,
                ownerId: rosterInfo.ownerId,
                ownerName: rosterInfo.ownerName,
                rosterSlot: rosterInfo.rosterSlot,
                isEliminated: eliminatedTeams.has(defense.abbreviation.toUpperCase()),
                stats: {},
                points: defense.totalPoints,
              });
            }
          }
        }
      }

      games.push(gameInfo);
    }

    // Sort games: in-progress first, then scheduled, then completed
    games.sort((a, b) => {
      const stateOrder = { in: 0, pre: 1, post: 2 };
      return stateOrder[a.status.state] - stateOrder[b.status.state];
    });

    return NextResponse.json({
      games,
      eliminatedTeams: Array.from(eliminatedTeams),
      week,
      year,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch games",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
