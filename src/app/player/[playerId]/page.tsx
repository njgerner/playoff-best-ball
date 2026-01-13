import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/db";
import { ScoringBreakdown } from "@/components/scoring-breakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";
import { getEliminatedTeams } from "@/lib/espn/client";

// Player headshot component
function PlayerHeadshot({
  espnId,
  playerName,
  size = 96,
}: {
  espnId?: string | null;
  playerName: string;
  size?: number;
}) {
  if (!espnId) {
    // Fallback placeholder
    return (
      <div
        className="bg-[rgba(255,255,255,0.1)] rounded-full flex items-center justify-center text-[var(--chalk-muted)]"
        style={{ width: size, height: size }}
      >
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
    );
  }

  const headshotUrl = `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`;

  return (
    <Image
      src={headshotUrl}
      alt={playerName}
      width={size}
      height={size}
      className="rounded-full bg-[rgba(255,255,255,0.1)] object-cover"
      unoptimized
    />
  );
}

// Team logo component for server-side
function TeamLogoSmall({ abbreviation }: { abbreviation: string }) {
  const logoUrl = `https://a.espncdn.com/i/teamlogos/nfl/500/${abbreviation.toLowerCase()}.png`;
  return (
    <Image
      src={logoUrl}
      alt={`${abbreviation} logo`}
      width={24}
      height={24}
      className="object-contain"
      unoptimized
    />
  );
}

// Stats summary interface
interface StatsSummary {
  passYards: number;
  passTd: number;
  passInt: number;
  rushYards: number;
  rushTd: number;
  recYards: number;
  recTd: number;
  receptions: number;
  fumblesLost: number;
  fgMade: number;
  xpMade: number;
  sacks: number;
  interceptions: number;
  defensiveTd: number;
}

function aggregateStats(scores: { breakdown: unknown }[]): StatsSummary {
  const summary: StatsSummary = {
    passYards: 0,
    passTd: 0,
    passInt: 0,
    rushYards: 0,
    rushTd: 0,
    recYards: 0,
    recTd: 0,
    receptions: 0,
    fumblesLost: 0,
    fgMade: 0,
    xpMade: 0,
    sacks: 0,
    interceptions: 0,
    defensiveTd: 0,
  };

  for (const score of scores) {
    const breakdown = score.breakdown as Record<string, number> | null;
    if (!breakdown) continue;

    summary.passYards += breakdown.passYards || 0;
    summary.passTd += breakdown.passTd || 0;
    summary.passInt += breakdown.passInt || 0;
    summary.rushYards += breakdown.rushYards || 0;
    summary.rushTd += breakdown.rushTd || 0;
    summary.recYards += breakdown.recYards || 0;
    summary.recTd += breakdown.recTd || 0;
    summary.receptions += breakdown.receptions || 0;
    summary.fumblesLost += breakdown.fumblesLost || 0;
    summary.fgMade += breakdown.fgMade || 0;
    summary.xpMade += breakdown.xpMade || 0;
    summary.sacks += breakdown.sacks || 0;
    summary.interceptions += breakdown.interceptions || breakdown.defInt || 0;
    summary.defensiveTd += breakdown.defensiveTd || breakdown.dstTd || 0;
  }

  return summary;
}

// Stats section component
function StatsSection({
  position,
  scores,
}: {
  position: string;
  scores: { breakdown: unknown }[];
}) {
  const stats = aggregateStats(scores);
  const gamesPlayed = scores.filter((s) => s.breakdown).length;

  // Show different stats based on position
  const statItems: { label: string; value: string | number; highlight?: boolean }[] = [];

  if (position === "QB") {
    statItems.push(
      {
        label: "Pass Yards",
        value: stats.passYards.toLocaleString(),
        highlight: stats.passYards > 0,
      },
      { label: "Pass TD", value: stats.passTd, highlight: stats.passTd > 0 },
      { label: "INT", value: stats.passInt },
      { label: "Rush Yards", value: stats.rushYards, highlight: stats.rushYards > 0 },
      { label: "Rush TD", value: stats.rushTd, highlight: stats.rushTd > 0 }
    );
  } else if (position === "RB") {
    statItems.push(
      {
        label: "Rush Yards",
        value: stats.rushYards.toLocaleString(),
        highlight: stats.rushYards > 0,
      },
      { label: "Rush TD", value: stats.rushTd, highlight: stats.rushTd > 0 },
      { label: "Receptions", value: stats.receptions, highlight: stats.receptions > 0 },
      { label: "Rec Yards", value: stats.recYards, highlight: stats.recYards > 0 },
      { label: "Rec TD", value: stats.recTd, highlight: stats.recTd > 0 }
    );
  } else if (position === "WR" || position === "TE") {
    statItems.push(
      { label: "Receptions", value: stats.receptions, highlight: stats.receptions > 0 },
      { label: "Rec Yards", value: stats.recYards.toLocaleString(), highlight: stats.recYards > 0 },
      { label: "Rec TD", value: stats.recTd, highlight: stats.recTd > 0 },
      { label: "Rush Yards", value: stats.rushYards, highlight: stats.rushYards > 0 },
      { label: "Rush TD", value: stats.rushTd, highlight: stats.rushTd > 0 }
    );
  } else if (position === "K") {
    statItems.push(
      { label: "FG Made", value: stats.fgMade, highlight: stats.fgMade > 0 },
      { label: "XP Made", value: stats.xpMade, highlight: stats.xpMade > 0 }
    );
  } else if (position === "DST") {
    statItems.push(
      { label: "Sacks", value: stats.sacks, highlight: stats.sacks > 0 },
      { label: "INT", value: stats.interceptions, highlight: stats.interceptions > 0 },
      { label: "Def TD", value: stats.defensiveTd, highlight: stats.defensiveTd > 0 }
    );
  }

  // Filter out empty stats for cleaner display
  const filteredStats = statItems.filter((item) => item.value !== 0 && item.value !== "0");

  if (filteredStats.length === 0) return null;

  return (
    <div className="chalk-box p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[var(--chalk-white)]">Playoff Stats</h3>
        <span className="text-xs text-[var(--chalk-muted)]">
          {gamesPlayed} game{gamesPlayed !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {filteredStats.map((item) => (
          <div key={item.label} className="text-center">
            <div
              className={`text-xl sm:text-2xl font-bold ${item.highlight ? "text-[var(--chalk-green)]" : "text-[var(--chalk-white)]"}`}
            >
              {item.value}
            </div>
            <div className="text-[10px] sm:text-xs text-[var(--chalk-muted)] uppercase tracking-wide">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <div className="flex items-start gap-4 sm:gap-6">
        {/* Player Headshot */}
        <div className="flex-shrink-0">
          <PlayerHeadshot espnId={player.espnId} playerName={player.name} size={96} />
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <Link
            href="/rosters"
            className="text-sm text-[var(--chalk-pink)] hover:underline mb-2 inline-block"
          >
            &larr; Back to Rosters
          </Link>
          <h1
            className={`text-2xl sm:text-3xl font-bold chalk-text truncate ${isEliminated ? "text-[var(--chalk-muted)]" : "text-[var(--chalk-yellow)]"}`}
          >
            {player.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
            <span className={`chalk-badge ${badgeClass} ${isEliminated ? "opacity-50" : ""}`}>
              {player.position}
            </span>
            {player.team && (
              <span
                className={`flex items-center gap-1.5 text-sm ${isEliminated ? "text-red-400" : "text-[var(--chalk-muted)]"}`}
              >
                <TeamLogoSmall abbreviation={player.team} />
                {player.team}
                {isEliminated && (
                  <span className="ml-1 text-xs bg-red-900/50 px-1.5 py-0.5 rounded">OUT</span>
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

        {/* Total Points */}
        <div className="text-right flex-shrink-0">
          <div className="text-sm text-[var(--chalk-muted)]">Total Points</div>
          <div
            className={`text-3xl sm:text-4xl font-bold chalk-score ${isEliminated ? "text-[var(--chalk-muted)]" : "text-[var(--chalk-green)]"}`}
          >
            {totalPoints.toFixed(1)}
          </div>
          {isEliminated && <div className="text-xs text-red-400 mt-1">Final</div>}
        </div>
      </div>

      {/* Stats Summary */}
      {player.scores.length > 0 && (
        <StatsSection position={player.position} scores={player.scores} />
      )}

      {/* Season Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Points by Round</CardTitle>
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
