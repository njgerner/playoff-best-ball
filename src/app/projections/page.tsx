"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";

interface ProjectionPlayer {
  id: string;
  name: string;
  position: string;
  team: string | null;
  slot: string;
  actualPoints: number;
  projectedPoints: number;
  teamWinProb: number | null;
  expectedValue: number | null;
  opponent: string | null;
}

interface OwnerProjection {
  ownerId: string;
  ownerName: string;
  players: ProjectionPlayer[];
  actualPoints: number;
  projectedPoints: number;
  expectedValue: number;
  totalExpectedValue: number;
}

interface ProjectionsData {
  projections: OwnerProjection[];
  week: number | null;
  year: number;
  lastUpdated: string;
}

interface OddsData {
  odds: {
    team: string;
    opponent: string;
    winProb: number;
    moneyline: number | null;
  }[];
}

export default function ProjectionsPage() {
  const [data, setData] = useState<ProjectionsData | null>(null);
  const [odds, setOdds] = useState<OddsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(2);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectionsRes, oddsRes] = await Promise.all([
        fetch(`/api/projections?year=${CURRENT_SEASON_YEAR}&week=${selectedWeek}`),
        fetch(`/api/odds?year=${CURRENT_SEASON_YEAR}&week=${selectedWeek}`),
      ]);

      if (!projectionsRes.ok) throw new Error("Failed to fetch projections");

      const projectionsData = await projectionsRes.json();
      setData(projectionsData);

      if (oddsRes.ok) {
        const oddsData = await oddsRes.json();
        setOdds(oddsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSyncProjections = async () => {
    try {
      setSyncing(true);
      const response = await fetch(
        `/api/projections/sync?year=${CURRENT_SEASON_YEAR}&week=${selectedWeek}`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to sync projections");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncOdds = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`/api/odds?year=${CURRENT_SEASON_YEAR}&week=${selectedWeek}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to sync odds");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync odds");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-[var(--chalk-muted)]">Loading projections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  const weekLabels: Record<number, string> = {
    1: "Wild Card",
    2: "Divisional",
    3: "Conference",
    5: "Super Bowl",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--chalk-yellow)] chalk-text">Projections</h1>
          <p className="text-sm text-[var(--chalk-muted)]">
            Expected value based on playoff performance and Vegas odds
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Week Selector */}
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="bg-[var(--chalk-surface)] border border-[var(--chalk-border)] rounded px-3 py-1.5 text-sm text-[var(--chalk-text)]"
          >
            {[1, 2, 3, 5].map((week) => (
              <option key={week} value={week}>
                Week {week}: {weekLabels[week]}
              </option>
            ))}
          </select>

          {/* Sync Buttons */}
          <button
            onClick={handleSyncOdds}
            disabled={syncing}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded transition-colors"
          >
            {syncing ? "..." : "Sync Odds"}
          </button>
          <button
            onClick={handleSyncProjections}
            disabled={syncing}
            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded transition-colors"
          >
            {syncing ? "..." : "Sync Projections"}
          </button>
        </div>
      </div>

      {/* Team Odds Summary */}
      {odds && odds.odds.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-[var(--chalk-text)]">
              {weekLabels[selectedWeek]} Matchups
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {odds.odds
                .filter((o, i, arr) => arr.findIndex((x) => x.team === o.opponent) > i)
                .map((game) => {
                  const opponent = odds.odds.find((o) => o.team === game.opponent);
                  return (
                    <div
                      key={`${game.team}-${game.opponent}`}
                      className="bg-[var(--chalk-surface)] rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-[var(--chalk-text)]">{game.team}</span>
                        <span className="text-sm text-[var(--chalk-green)]">
                          {(game.winProb * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--chalk-green)]"
                          style={{ width: `${game.winProb * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-semibold text-[var(--chalk-text)]">
                          {game.opponent}
                        </span>
                        <span className="text-sm text-[var(--chalk-blue)]">
                          {opponent ? (opponent.winProb * 100).toFixed(0) : "?"}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-lg font-semibold text-[var(--chalk-text)]">
            Expected Value Leaderboard
          </h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--chalk-border)]">
                  <th className="text-left py-2 px-2 text-[var(--chalk-muted)]">Rank</th>
                  <th className="text-left py-2 px-2 text-[var(--chalk-muted)]">Owner</th>
                  <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">Actual</th>
                  <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">Projected</th>
                  <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">EV</th>
                  <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">Total EV</th>
                </tr>
              </thead>
              <tbody>
                {data?.projections.map((owner, index) => (
                  <tr
                    key={owner.ownerId}
                    className="border-b border-[var(--chalk-border)]/50 hover:bg-[var(--chalk-surface)]"
                  >
                    <td className="py-2 px-2">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-500/20 text-yellow-400"
                            : index === 1
                              ? "bg-gray-400/20 text-gray-300"
                              : index === 2
                                ? "bg-amber-600/20 text-amber-500"
                                : "bg-[var(--chalk-surface)] text-[var(--chalk-muted)]"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-semibold text-[var(--chalk-text)]">
                      {owner.ownerName}
                    </td>
                    <td className="py-2 px-2 text-right text-[var(--chalk-text)]">
                      {owner.actualPoints.toFixed(1)}
                    </td>
                    <td className="py-2 px-2 text-right text-[var(--chalk-blue)]">
                      {owner.projectedPoints.toFixed(1)}
                    </td>
                    <td className="py-2 px-2 text-right text-[var(--chalk-muted)]">
                      {owner.expectedValue.toFixed(1)}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-[var(--chalk-green)]">
                      {owner.totalExpectedValue.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Owner Cards with Player Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.projections.map((owner, rank) => (
          <Card key={owner.ownerId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                      rank === 0
                        ? "bg-yellow-500/20 text-yellow-400"
                        : rank === 1
                          ? "bg-gray-400/20 text-gray-300"
                          : rank === 2
                            ? "bg-amber-600/20 text-amber-500"
                            : "bg-[var(--chalk-surface)] text-[var(--chalk-muted)]"
                    }`}
                  >
                    {rank + 1}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--chalk-yellow)]">
                    {owner.ownerName}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--chalk-green)]">
                    {owner.totalExpectedValue.toFixed(1)}
                  </div>
                  <div className="text-xs text-[var(--chalk-muted)]">Total EV</div>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-[var(--chalk-muted)] mt-1">
                <span>Actual: {owner.actualPoints.toFixed(1)}</span>
                <span>Projected: {owner.projectedPoints.toFixed(1)}</span>
                <span>Remaining EV: {owner.expectedValue.toFixed(1)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {owner.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--chalk-surface)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-xs font-medium text-[var(--chalk-muted)]">
                        {player.slot}
                      </span>
                      <Link
                        href={`/player/${player.id}`}
                        className="text-sm text-[var(--chalk-text)] hover:text-[var(--chalk-blue)] transition-colors"
                      >
                        {player.name}
                      </Link>
                      {player.team && (
                        <span className="text-xs text-[var(--chalk-muted)]">{player.team}</span>
                      )}
                      {player.opponent && (
                        <span className="text-xs text-[var(--chalk-muted)]">
                          vs {player.opponent}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-[var(--chalk-text)] w-12 text-right">
                        {player.actualPoints.toFixed(1)}
                      </span>
                      <span className="text-[var(--chalk-blue)] w-12 text-right">
                        {player.projectedPoints.toFixed(1)}
                      </span>
                      {player.teamWinProb !== null && (
                        <span className="text-[var(--chalk-muted)] w-10 text-right text-xs">
                          {(player.teamWinProb * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className="text-[var(--chalk-green)] w-12 text-right font-medium">
                        {player.expectedValue !== null ? player.expectedValue.toFixed(1) : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-3 pt-2 border-t border-[var(--chalk-border)]/50 text-xs text-[var(--chalk-muted)]">
                <span>Actual</span>
                <span className="text-[var(--chalk-blue)]">Projected</span>
                <span>Win%</span>
                <span className="text-[var(--chalk-green)]">EV</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
