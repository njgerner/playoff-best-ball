"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";

interface PlayerScore {
  id: string;
  name: string;
  position: string;
  team: string | null;
  slot: string;
  points: number;
  isEliminated: boolean;
  previousPoints?: number;
  projectedPoints?: number;
  expectedValue?: number | null;
}

interface OwnerRoster {
  ownerId: string;
  ownerName: string;
  players: PlayerScore[];
  totalPoints: number;
  activePlayers: number;
  previousTotal?: number;
  projectedPoints?: number;
  expectedValue?: number;
}

interface LiveData {
  rosters: OwnerRoster[];
  eliminatedTeams: string[];
  lastUpdated: string;
  week: number;
}

interface ProjectionData {
  projections: {
    ownerId: string;
    players: {
      id: string;
      projectedPoints: number;
      expectedValue: number | null;
    }[];
    projectedPoints: number;
    expectedValue: number;
  }[];
}

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
  const [showProjections, setShowProjections] = useState(false);

  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both live scores and projections
      const [liveResponse, projectionsResponse] = await Promise.all([
        fetch(`/api/live?year=${CURRENT_SEASON_YEAR}`),
        fetch(`/api/projections?year=${CURRENT_SEASON_YEAR}`),
      ]);

      if (!liveResponse.ok) {
        throw new Error(`Failed to fetch: ${liveResponse.status}`);
      }

      const result = await liveResponse.json();
      let projections: ProjectionData | null = null;

      if (projectionsResponse.ok) {
        projections = await projectionsResponse.json();
      }

      // Check for score changes and add previousPoints + projections
      if (data?.rosters) {
        result.rosters = result.rosters.map((roster: OwnerRoster) => {
          const prevRoster = data.rosters.find((r) => r.ownerId === roster.ownerId);
          const projRoster = projections?.projections.find((p) => p.ownerId === roster.ownerId);

          return {
            ...roster,
            previousTotal: prevRoster?.totalPoints,
            projectedPoints: projRoster?.projectedPoints || 0,
            expectedValue: projRoster?.expectedValue || 0,
            players: roster.players.map((player) => {
              const prevPlayer = prevRoster?.players.find((p) => p.id === player.id);
              const projPlayer = projRoster?.players.find((p) => p.id === player.id);
              return {
                ...player,
                previousPoints: prevPlayer?.points,
                projectedPoints: projPlayer?.projectedPoints || 0,
                expectedValue: projPlayer?.expectedValue,
              };
            }),
          };
        });
      } else if (projections) {
        // First load - add projections
        result.rosters = result.rosters.map((roster: OwnerRoster) => {
          const projRoster = projections?.projections.find((p) => p.ownerId === roster.ownerId);
          return {
            ...roster,
            projectedPoints: projRoster?.projectedPoints || 0,
            expectedValue: projRoster?.expectedValue || 0,
            players: roster.players.map((player) => {
              const projPlayer = projRoster?.players.find((p) => p.id === player.id);
              return {
                ...player,
                projectedPoints: projPlayer?.projectedPoints || 0,
                expectedValue: projPlayer?.expectedValue,
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
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-first Header - compact with inline refresh */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-[var(--chalk-yellow)] chalk-text">
            Live
          </h1>
          {autoRefresh && (
            <span className="text-xs text-[var(--chalk-muted)] tabular-nums">{countdown}s</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick refresh button - always visible */}
          <button
            onClick={fetchScores}
            disabled={loading}
            className="p-2 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Refresh"
          >
            <svg
              className={`w-5 h-5 text-[var(--chalk-blue)] ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 p-3 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Leaderboard Summary - THE MAIN CONTENT */}
      <div className="chalk-box p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {sortedRosters.map((roster, index) => {
            const pointChange =
              roster.previousTotal !== undefined ? roster.totalPoints - roster.previousTotal : null;
            const isUp = pointChange !== null && pointChange > 0;
            const totalEV = roster.totalPoints + (roster.expectedValue || 0);

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
                <div className="font-bold text-[var(--chalk-white)] truncate text-sm sm:text-base">
                  {roster.ownerName}
                </div>
                <div className="text-lg font-bold text-[var(--chalk-green)] chalk-score">
                  {roster.totalPoints.toFixed(1)}
                </div>
                {showProjections &&
                  roster.expectedValue !== undefined &&
                  roster.expectedValue > 0 && (
                    <div className="text-xs text-[var(--chalk-blue)]">EV: {totalEV.toFixed(1)}</div>
                  )}
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

        {/* Compact controls row - inside the leaderboard box */}
        <div className="mt-3 pt-3 border-t border-dashed border-[var(--chalk-muted)]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showProjections}
                onChange={(e) => setShowProjections(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-[var(--chalk-blue)]">EV</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-[var(--chalk-muted)]">Auto</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--chalk-muted)]">
              {lastFetch ? lastFetch.toLocaleTimeString() : "..."}
            </span>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-[var(--chalk-green)] hover:underline disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync ESPN"}
            </button>
          </div>
        </div>
      </div>

      {/* All Rosters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
                  <span className="font-bold text-[var(--chalk-white)]">{roster.ownerName}</span>
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
                const posColor = POSITION_COLORS[player.position] || "text-[var(--chalk-white)]";
                const hasEV =
                  player.expectedValue !== undefined &&
                  player.expectedValue !== null &&
                  player.expectedValue > 0;

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
                      {showProjections && hasEV && (
                        <span className="text-xs text-[var(--chalk-blue)] mr-1">
                          +{player.expectedValue!.toFixed(1)}
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

      {/* Loading overlay */}
      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="text-[var(--chalk-muted)]">Loading scores...</div>
        </div>
      )}
    </div>
  );
}
