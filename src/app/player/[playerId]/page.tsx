import Link from "next/link";
import prisma from "@/lib/db";
import { ScoringBreakdown } from "@/components/scoring-breakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";
import { getEliminatedTeams } from "@/lib/espn/client";

const WEEK_LABELS: Record<number, string> = {
  1: "Wild Card Round",
  2: "Divisional Round",
  3: "Conference Championships",
  5: "Super Bowl",
};

interface PlayerPageProps {
  params: Promise<{ playerId: string }>;
}

async function getPlayerData(playerId: string) {
  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        scores: {
          where: { year: CURRENT_SEASON_YEAR },
          orderBy: { week: "asc" },
        },
        rosters: {
          where: { year: CURRENT_SEASON_YEAR },
          include: { owner: true },
        },
      },
    });

    return player;
  } catch (error) {
    console.error("Error fetching player:", error);
    return null;
  }
}

const positionBadgeClasses: Record<string, string> = {
  QB: "chalk-badge-qb",
  RB: "chalk-badge-rb",
  WR: "chalk-badge-wr",
  TE: "chalk-badge-te",
  K: "chalk-badge-k",
  DST: "chalk-badge-dst",
};

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerId } = await params;
  const player = await getPlayerData(playerId);

  if (!player) {
    notFound();
  }

  const totalPoints = player.scores.reduce((sum, s) => sum + s.points, 0);
  const owner = player.rosters[0]?.owner;
  const badgeClass = positionBadgeClasses[player.position] ?? "chalk-badge-flex";

  // Check if player's team is eliminated
  const eliminatedTeams = await getEliminatedTeams();
  const isEliminated = player.team ? eliminatedTeams.has(player.team.toUpperCase()) : false;

  return (
    <div className="space-y-6">
      {/* Elimination Banner */}
      {isEliminated && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
          <svg
            className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <div className="text-red-400 font-bold">Team Eliminated</div>
            <div className="text-red-300 text-sm">
              {player.team} has been eliminated from the playoffs. This player will not score any
              additional points this season.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/rosters"
            className="text-sm text-[var(--chalk-pink)] hover:underline mb-2 inline-block"
          >
            &larr; Back to Rosters
          </Link>
          <h1
            className={`text-3xl font-bold chalk-text ${isEliminated ? "text-[var(--chalk-muted)]" : "text-[var(--chalk-yellow)]"}`}
          >
            {player.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`chalk-badge ${badgeClass} ${isEliminated ? "opacity-50" : ""}`}>
              {player.position}
            </span>
            {player.team && (
              <span
                className={`text-sm ${isEliminated ? "text-red-400" : "text-[var(--chalk-muted)]"}`}
              >
                {player.team}
                {isEliminated && (
                  <span className="ml-2 text-xs bg-red-900/50 px-1.5 py-0.5 rounded">OUT</span>
                )}
              </span>
            )}
            {owner && (
              <span className="text-sm text-[var(--chalk-muted)]">
                Owner: <span className="font-medium text-[var(--chalk-white)]">{owner.name}</span>
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-[var(--chalk-muted)]">Total Points</div>
          <div
            className={`text-4xl font-bold chalk-score ${isEliminated ? "text-[var(--chalk-muted)]" : "text-[var(--chalk-green)]"}`}
          >
            {totalPoints.toFixed(1)}
          </div>
          {isEliminated && <div className="text-xs text-red-400 mt-1">Final</div>}
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Season Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 5].map((week) => {
              const weekScore = player.scores.find((s) => s.week === week);
              return (
                <div
                  key={week}
                  className="text-center p-4 bg-[rgba(0,0,0,0.2)] rounded-lg border border-dashed border-[rgba(255,255,255,0.1)]"
                >
                  <div className="text-xs text-[var(--chalk-muted)] mb-1">{WEEK_LABELS[week]}</div>
                  <div
                    className={`text-2xl font-bold chalk-score ${
                      weekScore && weekScore.points > 0
                        ? "text-[var(--chalk-green)]"
                        : "text-[var(--chalk-muted)]"
                    }`}
                  >
                    {weekScore ? weekScore.points.toFixed(1) : "-"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Game-by-Game Breakdowns */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--chalk-white)] mb-4 chalk-text">
          Scoring Breakdown by Game
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 5].map((week) => {
            const weekScore = player.scores.find((s) => s.week === week);
            const breakdown = weekScore?.breakdown as Record<string, number> | null;

            return (
              <ScoringBreakdown
                key={week}
                playerName={player.name}
                week={week}
                weekLabel={WEEK_LABELS[week]}
                stats={breakdown ?? {}}
                totalPoints={weekScore?.points ?? 0}
              />
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      <div className="chalk-box chalk-box-blue p-6">
        <h3 className="font-semibold text-[var(--chalk-blue)] mb-2 chalk-text">
          How Scoring Works
        </h3>
        <p className="text-sm text-[var(--chalk-white)]">
          Points are calculated from ESPN box score data. Each stat category has a specific point
          value (e.g., 1 point per 10 rushing yards, 6 points per TD). The breakdown above shows
          exactly how each point was earned. See the{" "}
          <Link href="/scoring" className="text-[var(--chalk-pink)] underline hover:no-underline">
            Scoring Rules
          </Link>{" "}
          page for the complete scoring system.
        </p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
