"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";
import { PlayoffGame, GamePlayer } from "@/types";

interface LiveGamesData {
  games: PlayoffGame[];
  eliminatedTeams: string[];
  week: number;
  year: number;
  lastUpdated: string;
}

const POSITION_COLORS: Record<string, string> = {
  QB: "text-red-400",
  RB: "text-green-400",
  WR: "text-blue-400",
  TE: "text-yellow-400",
  K: "text-purple-400",
  DST: "text-orange-400",
  FLEX: "text-pink-400",
};

const WEEK_LABELS: Record<number, string> = {
  1: "Wild Card",
  2: "Divisional",
  3: "Conference",
  5: "Super Bowl",
};

function formatQuarter(period?: number): string {
  if (!period) return "";
  if (period <= 4) return `Q${period}`;
  return `OT${period - 4 > 1 ? period - 4 : ""}`;
}

function GameStatusBadge({ status }: { status: PlayoffGame["status"] }) {
  if (status.state === "in") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 text-xs font-medium animate-pulse">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
        LIVE
      </span>
    );
  }
  if (status.completed) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 text-xs font-medium">
        FINAL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 text-xs font-medium">
      {status.detail}
    </span>
  );
}

function PlayerStatLine({ player }: { player: GamePlayer }) {
  const posColor = POSITION_COLORS[player.position] || "text-[var(--chalk-white)]";

  // Build stat summary
  const statParts: string[] = [];
  if (player.stats.passYards) {
    const passTd = player.stats.passTd || 0;
    const passInt = player.stats.passInt || 0;
    statParts.push(
      `${player.stats.passYards} pass yds${passTd ? `, ${passTd} TD` : ""}${passInt ? `, ${passInt} INT` : ""}`
    );
  }
  if (player.stats.rushYards) {
    const rushTd = player.stats.rushTd || 0;
    statParts.push(`${player.stats.rushYards} rush yds${rushTd ? `, ${rushTd} TD` : ""}`);
  }
  if (player.stats.receptions || player.stats.recYards) {
    const rec = player.stats.receptions || 0;
    const yards = player.stats.recYards || 0;
    const recTd = player.stats.recTd || 0;
    statParts.push(`${rec} rec, ${yards} yds${recTd ? `, ${recTd} TD` : ""}`);
  }

  const statSummary = statParts.join(" | ") || "No stats yet";

  return (
    <Link
      href={`/player/${player.playerId}`}
      className={`block p-2 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors ${
        player.isEliminated ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-mono w-8 ${posColor}`}>{player.position}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--chalk-white)] truncate">
                {player.playerName}
              </span>
              {player.isEliminated && (
                <span className="text-xs text-red-400 px-1 py-0.5 bg-red-900/30 rounded">OUT</span>
              )}
            </div>
            <div className="text-xs text-[var(--chalk-muted)]">{player.ownerName}</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <div
            className={`text-sm font-bold ${
              player.points > 0 ? "text-[var(--chalk-green)]" : "text-[var(--chalk-muted)]"
            }`}
          >
            {player.points.toFixed(1)} pts
          </div>
        </div>
      </div>
      <div className="mt-1 text-xs text-[var(--chalk-muted)] truncate pl-10">{statSummary}</div>
    </Link>
  );
}

function GameCard({ game }: { game: PlayoffGame }) {
  const awayWinning = game.awayTeam.score > game.homeTeam.score;
  const homeWinning = game.homeTeam.score > game.awayTeam.score;
  const isLive = game.status.state === "in";

  // Group players by team
  const awayPlayers = game.players.filter(
    (p) => p.team.toUpperCase() === game.awayTeam.abbreviation.toUpperCase()
  );
  const homePlayers = game.players.filter(
    (p) => p.team.toUpperCase() === game.homeTeam.abbreviation.toUpperCase()
  );

  return (
    <div className="chalk-box overflow-hidden">
      {/* Game Header */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--chalk-muted)]">
            {WEEK_LABELS[game.week] || `Week ${game.week}`}
          </span>
          <GameStatusBadge status={game.status} />
        </div>

        {/* Scoreboard */}
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  awayWinning ? "text-[var(--chalk-white)]" : "text-[var(--chalk-muted)]"
                }`}
              >
                {game.awayTeam.abbreviation}
              </div>
              <div className="text-xs text-[var(--chalk-muted)]">{game.awayTeam.displayName}</div>
            </div>
            <div
              className={`text-3xl font-bold chalk-score ${
                awayWinning ? "text-[var(--chalk-green)]" : "text-[var(--chalk-white)]"
              }`}
            >
              {game.awayTeam.score}
            </div>
          </div>

          {/* Game Info */}
          <div className="text-center px-4">
            {isLive ? (
              <div className="text-[var(--chalk-green)]">
                <div className="text-sm font-medium">{formatQuarter(game.status.period)}</div>
                <div className="text-lg font-bold">{game.status.displayClock}</div>
              </div>
            ) : game.status.completed ? (
              <div className="text-[var(--chalk-muted)] text-sm">Final</div>
            ) : (
              <div className="text-[var(--chalk-muted)] text-xs">{game.status.detail}</div>
            )}
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-3">
            <div
              className={`text-3xl font-bold chalk-score ${
                homeWinning ? "text-[var(--chalk-green)]" : "text-[var(--chalk-white)]"
              }`}
            >
              {game.homeTeam.score}
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  homeWinning ? "text-[var(--chalk-white)]" : "text-[var(--chalk-muted)]"
                }`}
              >
                {game.homeTeam.abbreviation}
              </div>
              <div className="text-xs text-[var(--chalk-muted)]">{game.homeTeam.displayName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Players Section */}
      {game.players.length > 0 && (
        <div className="p-3">
          <div className="text-xs font-medium text-[var(--chalk-muted)] mb-2 uppercase tracking-wider">
            Your Players in This Game
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {/* Away Team Players */}
            {awayPlayers.length > 0 && (
              <div>
                <div className="text-xs text-[var(--chalk-muted)] mb-1 px-2">
                  {game.awayTeam.abbreviation}
                </div>
                {awayPlayers.map((player) => (
                  <PlayerStatLine key={player.playerId} player={player} />
                ))}
              </div>
            )}
            {/* Home Team Players */}
            {homePlayers.length > 0 && (
              <div>
                <div className="text-xs text-[var(--chalk-muted)] mb-1 px-2">
                  {game.homeTeam.abbreviation}
                </div>
                {homePlayers.map((player) => (
                  <PlayerStatLine key={player.playerId} player={player} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No players message */}
      {game.players.length === 0 && game.status.state !== "pre" && (
        <div className="p-3 text-center text-sm text-[var(--chalk-muted)]">
          No rostered players in this game
        </div>
      )}
      {game.status.state === "pre" && (
        <div className="p-3 text-center text-sm text-[var(--chalk-muted)]">
          Game has not started yet
        </div>
      )}
    </div>
  );
}

export function LiveGames() {
  const [data, setData] = useState<LiveGamesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const fetchGames = useCallback(async (week: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/games?year=${CURRENT_SEASON_YEAR}&week=${week}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch games");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames(selectedWeek);
  }, [selectedWeek, fetchGames]);

  // Auto-refresh every 30 seconds for live games
  useEffect(() => {
    const hasLiveGames = data?.games.some((g) => g.status.state === "in");
    if (!hasLiveGames) return;

    const interval = setInterval(() => {
      fetchGames(selectedWeek);
    }, 30000);

    return () => clearInterval(interval);
  }, [data, selectedWeek, fetchGames]);

  const weeks = [1, 2, 3, 5];

  return (
    <div className="space-y-4">
      {/* Week Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => setSelectedWeek(week)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              selectedWeek === week
                ? "bg-[var(--chalk-blue)] text-white"
                : "bg-[rgba(255,255,255,0.1)] text-[var(--chalk-muted)] hover:bg-[rgba(255,255,255,0.15)]"
            }`}
          >
            {WEEK_LABELS[week] || `Week ${week}`}
          </button>
        ))}
        <button
          onClick={() => fetchGames(selectedWeek)}
          disabled={loading}
          className="ml-auto chalk-button chalk-button-blue text-sm px-3 py-1"
        >
          {loading ? "..." : "Refresh"}
        </button>
      </div>

      {/* Eliminated Teams Banner */}
      {data?.eliminatedTeams && data.eliminatedTeams.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="text-xs text-red-400 font-medium mb-1">Eliminated Teams</div>
          <div className="text-sm text-[var(--chalk-muted)]">{data.eliminatedTeams.join(", ")}</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="text-center py-8 text-[var(--chalk-muted)]">Loading games...</div>
      )}

      {/* No Games */}
      {!loading && data?.games.length === 0 && (
        <div className="text-center py-8 text-[var(--chalk-muted)]">
          No games scheduled for this week
        </div>
      )}

      {/* Games Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data?.games.map((game) => (
          <GameCard key={game.eventId} game={game} />
        ))}
      </div>

      {/* Last Updated */}
      {data?.lastUpdated && (
        <div className="text-xs text-[var(--chalk-muted)] text-center">
          Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
