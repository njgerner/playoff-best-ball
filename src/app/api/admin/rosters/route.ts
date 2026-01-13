import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";
import { getEliminatedTeams } from "@/lib/espn/client";

// GET /api/admin/rosters - Get all rosters with players
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || String(CURRENT_SEASON_YEAR));

    const [owners, eliminatedTeams] = await Promise.all([
      prisma.owner.findMany({
        include: {
          rosters: {
            where: { year },
            include: {
              player: {
                include: {
                  scores: {
                    where: { year },
                  },
                },
              },
            },
            orderBy: { rosterSlot: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      getEliminatedTeams(),
    ]);

    // Transform data for the frontend
    const rostersData = owners.map((owner) => {
      const players = owner.rosters.map((roster) => {
        const totalPoints = roster.player.scores.reduce((sum, s) => sum + s.points, 0);
        const isEliminated = roster.player.team
          ? eliminatedTeams.has(roster.player.team.toUpperCase())
          : false;

        return {
          rosterId: roster.id,
          playerId: roster.player.id,
          name: roster.player.name,
          position: roster.player.position,
          team: roster.player.team,
          espnId: roster.player.espnId,
          rosterSlot: roster.rosterSlot,
          totalPoints,
          isEliminated,
          hasEspnId: !!roster.player.espnId,
        };
      });

      const totalPoints = players.reduce((sum, p) => sum + p.totalPoints, 0);
      const activePlayers = players.filter((p) => !p.isEliminated).length;

      return {
        ownerId: owner.id,
        ownerName: owner.name,
        players,
        totalPoints,
        activePlayers,
        totalPlayers: players.length,
      };
    });

    return NextResponse.json({
      rosters: rostersData,
      year,
      eliminatedTeams: Array.from(eliminatedTeams),
    });
  } catch (error) {
    console.error("Error fetching rosters:", error);
    return NextResponse.json({ error: "Failed to fetch rosters" }, { status: 500 });
  }
}

// POST /api/admin/rosters - Add player to roster
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ownerId,
      playerId,
      playerName,
      position,
      team,
      rosterSlot,
      year = CURRENT_SEASON_YEAR,
    } = body;

    if (!ownerId || !rosterSlot) {
      return NextResponse.json(
        { error: "Missing required fields: ownerId, rosterSlot" },
        { status: 400 }
      );
    }

    // If playerId is provided, use existing player
    // Otherwise, create a new player
    let player;
    if (playerId) {
      player = await prisma.player.findUnique({ where: { id: playerId } });
      if (!player) {
        return NextResponse.json({ error: "Player not found" }, { status: 404 });
      }
    } else if (playerName && position) {
      // Check if player already exists
      player = await prisma.player.findFirst({
        where: { name: playerName, position },
      });

      if (!player) {
        // Create new player
        player = await prisma.player.create({
          data: {
            name: playerName,
            position,
            team: team || null,
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: "Must provide playerId or playerName+position" },
        { status: 400 }
      );
    }

    // Check if roster slot is already taken
    const existingRoster = await prisma.roster.findFirst({
      where: {
        ownerId,
        rosterSlot,
        year,
      },
    });

    if (existingRoster) {
      return NextResponse.json(
        { error: `Roster slot ${rosterSlot} is already filled` },
        { status: 400 }
      );
    }

    // Create roster entry
    const roster = await prisma.roster.create({
      data: {
        ownerId,
        playerId: player.id,
        rosterSlot,
        year,
      },
      include: {
        player: true,
        owner: true,
      },
    });

    return NextResponse.json({
      success: true,
      roster: {
        rosterId: roster.id,
        playerId: roster.player.id,
        name: roster.player.name,
        position: roster.player.position,
        team: roster.player.team,
        rosterSlot: roster.rosterSlot,
        ownerName: roster.owner.name,
      },
    });
  } catch (error) {
    console.error("Error adding player to roster:", error);
    return NextResponse.json({ error: "Failed to add player to roster" }, { status: 500 });
  }
}

// DELETE /api/admin/rosters - Remove player from roster
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { rosterId } = body;

    if (!rosterId) {
      return NextResponse.json({ error: "Missing rosterId" }, { status: 400 });
    }

    const roster = await prisma.roster.delete({
      where: { id: rosterId },
      include: { player: true, owner: true },
    });

    return NextResponse.json({
      success: true,
      removed: {
        rosterId: roster.id,
        playerName: roster.player.name,
        ownerName: roster.owner.name,
        rosterSlot: roster.rosterSlot,
      },
    });
  } catch (error) {
    console.error("Error removing player from roster:", error);
    return NextResponse.json({ error: "Failed to remove player from roster" }, { status: 500 });
  }
}
