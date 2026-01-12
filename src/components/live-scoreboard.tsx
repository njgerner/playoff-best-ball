"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";
import { LiveGames } from "./live-games";

interface PlayerScore {
  id: string;
  name: string;
  position: string;
  team: string | null;
  slot: string;
  points: number;
  isEliminated: boolean;
  previousPoints?: number;
}

interface OwnerRoster {
  ownerId: string;
  ownerName: string;
  players: PlayerScore[];
  totalPoints: number;
  activePlayers: number;
  previousTotal?: number;
}

interface LiveData {
  rosters: OwnerRoster[];
  eliminatedTeams: string[];
  lastUpdated: string;
  week: number;
}

type ViewMode = "standings" | "games";

const POSITION_COLORS: Record<string, string> = {
  QB: "text-red-400",
  RB: "text-green-400",
  WR: "text-blue-400",
  TE: "text-yellow-400",
  K: "text-purple-400",
  DST: "text-orange-400",
};

export function LiveScoreboard() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [viewMode, setViewMode] = useState<ViewMode>("standings");

  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/live?year=${CURRENT_SEASON_YEAR}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const result = await response.json();

      // Check for score changes and add previousPoints
      if (data?.rosters) {
        result.rosters = result.rosters.map((roster: OwnerRoster) => {
          const prevRoster = data.rosters.find((r) => r.ownerId === roster.ownerId);
          return {
            ...roster,
            previousTotal: prevRoster?.totalPoints,
            players: roster.players.map((player) => {
              const prevPlayer = prevRoster?.players.find((p) => p.id === player.id);
              return {
                ...player,
                previousPoints: prevPlayer?.points,
              };
            }),
          };
        });
      }

      setData(result);
      setLastFetch(new Date());
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch scores");
    } finally {
      setLoading(false);
    }
  }, [data?.rosters]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: CURRENT_SEASON_YEAR,
          weeks: [1, 2, 3, 5],
        }),
      });
      // Refresh scores after sync
      await fetchScores();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchScores();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchScores();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchScores]);

  // Sort rosters by total points
  const sortedRosters = data?.rosters?.slice().sort((a, b) => b.totalPoints - a.totalPoints) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--chalk-yellow)] chalk-text">
            Live Scoreboard
          </h1>
          <p className="text-sm text-[var(--chalk-muted)] mt-1">
            {lastFetch ? `Last updated: ${lastFetch.toLocaleTimeString()}` : "Loading..."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-[var(--chalk-muted)]">
              Auto-refresh {autoRefresh && `(${countdown}s)`}
            </span>
          </label>

          {/* Manual refresh */}
          <button
            onClick={fetchScores}
            disabled={loading}
            className="chalk-button chalk-button-blue text-sm px-3 py-1"
          >
            {loading ? "..." : "Refresh"}
          </button>

          {/* Sync from ESPN */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="chalk-button chalk-button-green text-sm px-3 py-1"
          >
            {syncing ? "Syncing..." : "Sync ESPN"}
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-[rgba(255,255,255,0.1)] pb-2">
        <button
          onClick={() => setViewMode("standings")}
          className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
            viewMode === "standings"
              ? "bg-[var(--chalk-blue)] text-white"
              : "text-[var(--chalk-muted)] hover:text-[var(--chalk-white)]"
          }`}
        >
          Standings
        </button>
        <button
          onClick={() => setViewMode("games")}
          className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
            viewMode === "games"
              ? "bg-[var(--chalk-blue)] text-white"
              : "text-[var(--chalk-muted)] hover:text-[var(--chalk-white)]"
          }`}
        >
          Games
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Games View */}
      {viewMode === "games" && <LiveGames />}

      {/* Standings View */}
      {viewMode === "standings" && (
        <>
          {/* Leaderboard Summary */}
          <div className="chalk-box p-4">
            <h2 className="text-lg font-bold text-[var(--chalk-white)] mb-3 chalk-text">
              Standings
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {sortedRosters.map((roster, index) => {
                const pointChange =
                  roster.previousTotal !== undefined
                    ? roster.totalPoints - roster.previousTotal
                    : null;
                const isUp = pointChange !== null && pointChange > 0;

                return (
                  <div
                    key={roster.ownerId}
                    className={`p-3 rounded-lg text-center ${
                      index === 0
                        ? "bg-yellow-900/30 border border-yellow-500/30"
                        : "bg-[rgba(0,0,0,0.2)]"
                    }`}
                  >
                    <div className="text-xs text-[var(--chalk-muted)]">#{index + 1}</div>
                    <div className="font-bold text-[var(--chalk-white)]">{roster.ownerName}</div>
                    <div className="text-lg font-bold text-[var(--chalk-green)] chalk-score">
                      {roster.totalPoints.toFixed(1)}
                    </div>
                    <div className="text-xs text-[var(--chalk-muted)]">
                      {roster.activePlayers}/9 active
                    </div>
                    {isUp && (
                      <div className="text-xs text-green-400 animate-pulse">
                        +{pointChange.toFixed(1)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Rosters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedRosters.map((roster, index) => (
              <div key={roster.ownerId} className="chalk-box p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-black"
                          : index === 1
                            ? "bg-gray-400 text-black"
                            : index === 2
                              ? "bg-orange-600 text-white"
                              : "bg-[rgba(255,255,255,0.1)] text-[var(--chalk-muted)]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-[var(--chalk-white)]">
                        {roster.ownerName}
                      </span>
                      <div className="text-xs text-[var(--chalk-muted)]">
                        {roster.activePlayers}/9 active
                      </div>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-[var(--chalk-green)] chalk-score">
                    {roster.totalPoints.toFixed(1)}
                  </span>
                </div>

                <div className="space-y-1">
                  {roster.players.map((player) => {
                    const pointChange =
                      player.previousPoints !== undefined
                        ? player.points - player.previousPoints
                        : null;
                    const isUp = pointChange !== null && pointChange > 0.01;
                    const posColor =
                      POSITION_COLORS[player.position] || "text-[var(--chalk-white)]";

                    return (
                      <Link
                        key={player.id}
                        href={`/player/${player.id}`}
                        className={`flex items-center justify-between py-1 px-2 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors ${
                          isUp ? "bg-green-900/20" : ""
                        } ${player.isEliminated ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs font-mono w-6 ${posColor}`}>{player.slot}</span>
                          <span className="text-sm text-[var(--chalk-white)] truncate">
                            {player.name}
                          </span>
                          {player.isEliminated && (
                            <span className="text-xs text-red-400 px-1 py-0.5 bg-red-900/30 rounded">
                              OUT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isUp && (
                            <span className="text-xs text-green-400 animate-pulse">
                              +{pointChange.toFixed(1)}
                            </span>
                          )}
                          <span
                            className={`text-sm font-bold ${
                              player.points > 0
                                ? "text-[var(--chalk-green)]"
                                : "text-[var(--chalk-muted)]"
                            }`}
                          >
                            {player.points.toFixed(1)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Loading overlay */}
      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="text-[var(--chalk-muted)]">Loading scores...</div>
        </div>
      )}
    </div>
  );
}
