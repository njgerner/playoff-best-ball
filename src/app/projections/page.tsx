"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";

// Types for Rest of Playoffs view
interface WeekProjection {
  week: number;
  weekName: string;
  projectedPoints: number;
  advanceProb: number;
  expectedValue: number;
}

interface PlayerPlayoffProjection {
  id: string;
  name: string;
  position: string;
  team: string | null;
  slot: string;
  actualPoints: number;
  avgPointsPerGame: number;
  gamesPlayed: number;
  weeklyBreakdown: WeekProjection[];
  totalRemainingEV: number;
  champProb: number | null;
}

interface OwnerPlayoffProjection {
  ownerId: string;
  ownerName: string;
  players: PlayerPlayoffProjection[];
  actualPoints: number;
  totalRemainingEV: number;
  totalProjectedPoints: number;
  activePlayers: number;
  eliminatedPlayers: number;
}

interface PlayoffsData {
  projections: OwnerPlayoffProjection[];
  completedWeeks: number[];
  remainingWeeks: number[];
  currentWeek: number;
  year: number;
  lastUpdated: string;
  eliminatedTeams?: string[];
  eliminatedCount?: number;
  byeTeams?: string[];
  oddsCount?: number;
}

// Types for Single Week view
interface SingleWeekPlayer {
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
  isEliminated?: boolean;
  isByeWeek?: boolean;
}

interface SingleWeekOwner {
  ownerId: string;
  ownerName: string;
  players: SingleWeekPlayer[];
  actualPoints: number;
  projectedPoints: number;
  expectedValue: number;
  totalExpectedValue: number;
}

interface SingleWeekData {
  projections: SingleWeekOwner[];
  week: number | null;
  year: number;
  byeTeams?: string[];
  eliminatedTeams?: string[];
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

const weekNames: Record<number, string> = {
  1: "Wild Card",
  2: "Divisional",
  3: "Conference",
  5: "Super Bowl",
};

export default function ProjectionsPage() {
  const [viewMode, setViewMode] = useState<"playoffs" | "week">("playoffs");
  const [playoffsData, setPlayoffsData] = useState<PlayoffsData | null>(null);
  const [weekData, setWeekData] = useState<SingleWeekData | null>(null);
  const [odds, setOdds] = useState<OddsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1); // Default to Wild Card
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);

  const fetchPlayoffsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projections/playoffs?year=${CURRENT_SEASON_YEAR}`);
      if (!response.ok) throw new Error("Failed to fetch playoff projections");
      const data = await response.json();
      setPlayoffsData(data);

      // Also fetch odds for display
      const oddsRes = await fetch(`/api/odds?year=${CURRENT_SEASON_YEAR}`);
      if (oddsRes.ok) {
        setOdds(await oddsRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeekData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectionsRes, oddsRes] = await Promise.all([
        fetch(`/api/projections?year=${CURRENT_SEASON_YEAR}&week=${selectedWeek}`),
        fetch(`/api/odds?year=${CURRENT_SEASON_YEAR}&week=${selectedWeek}`),
      ]);
      if (!projectionsRes.ok) throw new Error("Failed to fetch projections");
      setWeekData(await projectionsRes.json());
      if (oddsRes.ok) {
        setOdds(await oddsRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    if (viewMode === "playoffs") {
      fetchPlayoffsData();
    } else {
      fetchWeekData();
    }
  }, [viewMode, fetchPlayoffsData, fetchWeekData]);

  const handleSyncAll = async () => {
    try {
      setSyncing(true);

      if (viewMode === "playoffs") {
        // For playoffs view, sync odds for current week (determined by API)
        // The Odds API only returns upcoming games, so we sync to week 1 (Wild Card)
        const currentWeek = playoffsData?.currentWeek || 1;
        await fetch(`/api/odds?year=${CURRENT_SEASON_YEAR}&week=${currentWeek}`, {
          method: "POST",
        });
        // Sync projections for current week
        await fetch(`/api/projections/sync?year=${CURRENT_SEASON_YEAR}&week=${currentWeek}`, {
          method: "POST",
        });
        await fetchPlayoffsData();
      } else {
        // For single week view, sync for selected week
        await fetch(`/api/odds?year=${CURRENT_SEASON_YEAR}&week=${selectedWeek}`, {
          method: "POST",
        });
        await fetch(`/api/projections/sync?year=${CURRENT_SEASON_YEAR}&week=${selectedWeek}`, {
          method: "POST",
        });
        await fetchWeekData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--chalk-yellow)] chalk-text">Projections</h1>
          <p className="text-sm text-[var(--chalk-muted)]">
            {viewMode === "playoffs"
              ? "Cumulative expected value for rest of playoffs"
              : `Expected value for ${weekNames[selectedWeek]}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--chalk-border)]">
            <button
              onClick={() => setViewMode("playoffs")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors min-h-[44px] ${
                viewMode === "playoffs"
                  ? "bg-[var(--chalk-yellow)] text-black font-semibold"
                  : "bg-[var(--chalk-surface)] text-[var(--chalk-text)] hover:bg-[var(--chalk-border)]"
              }`}
            >
              <span className="hidden sm:inline">Rest of </span>Playoffs
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors min-h-[44px] ${
                viewMode === "week"
                  ? "bg-[var(--chalk-yellow)] text-black font-semibold"
                  : "bg-[var(--chalk-surface)] text-[var(--chalk-text)] hover:bg-[var(--chalk-border)]"
              }`}
            >
              <span className="hidden sm:inline">Single </span>Week
            </button>
          </div>

          {viewMode === "week" && (
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="bg-[var(--chalk-surface)] border border-[var(--chalk-border)] rounded px-3 py-2 text-sm text-[var(--chalk-text)] min-h-[44px]"
            >
              {[1, 2, 3, 5].map((week) => (
                <option key={week} value={week}>
                  {weekNames[week]}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded transition-colors min-h-[44px]"
          >
            {syncing ? "..." : "Sync"}
          </button>
        </div>
      </div>

      {viewMode === "playoffs" && playoffsData && (
        <PlayoffsView
          data={playoffsData}
          expandedOwner={expandedOwner}
          setExpandedOwner={setExpandedOwner}
        />
      )}

      {viewMode === "week" && weekData && <SingleWeekView data={weekData} odds={odds} />}
    </div>
  );
}

// Rest of Playoffs View Component
function PlayoffsView({
  data,
  expandedOwner,
  setExpandedOwner,
}: {
  data: PlayoffsData;
  expandedOwner: string | null;
  setExpandedOwner: (id: string | null) => void;
}) {
  return (
    <>
      {/* Playoff Status */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-[var(--chalk-muted)]">Completed:</span>
        {data.completedWeeks.length === 0 ? (
          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded">None</span>
        ) : (
          data.completedWeeks.map((w) => (
            <span key={w} className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded">
              {weekNames[w]}
            </span>
          ))
        )}
        <span className="text-[var(--chalk-muted)] ml-2">Remaining:</span>
        {data.remainingWeeks.map((w) => (
          <span key={w} className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded">
            {weekNames[w]}
          </span>
        ))}
      </div>

      {/* Debug Info */}
      <div className="flex flex-wrap gap-4 text-xs bg-[var(--chalk-surface)] p-2 rounded">
        <span>
          <span className="text-[var(--chalk-muted)]">Eliminated:</span>{" "}
          <span className="text-red-400">{data.eliminatedCount ?? "?"}</span>
          {data.eliminatedTeams && data.eliminatedTeams.length > 0 && (
            <span className="text-[var(--chalk-muted)] ml-1">
              ({data.eliminatedTeams.join(", ")})
            </span>
          )}
        </span>
        {data.byeTeams && data.byeTeams.length > 0 && (
          <span>
            <span className="text-[var(--chalk-muted)]">Bye Teams:</span>{" "}
            <span className="text-purple-400">{data.byeTeams.join(", ")}</span>
          </span>
        )}
        <span>
          <span className="text-[var(--chalk-muted)]">Odds in DB:</span>{" "}
          <span
            className={data.oddsCount && data.oddsCount > 0 ? "text-green-400" : "text-yellow-400"}
          >
            {data.oddsCount ?? "0"}
          </span>
        </span>
        <span>
          <span className="text-[var(--chalk-muted)]">Year:</span>{" "}
          <span className="text-[var(--chalk-text)]">{data.year}</span>
        </span>
      </div>

      {/* Main Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-lg font-semibold text-[var(--chalk-text)]">
            Rest of Playoffs Leaderboard
          </h2>
        </CardHeader>
        <CardContent>
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {data.projections.map((owner, index) => {
              const totalEV = owner.actualPoints + owner.totalRemainingEV;
              return (
                <div
                  key={owner.ownerId}
                  className={`p-3 rounded-lg cursor-pointer ${
                    index === 0
                      ? "bg-yellow-900/30 border border-yellow-500/30"
                      : "bg-[rgba(0,0,0,0.2)] border border-[var(--chalk-muted)]/20"
                  }`}
                  onClick={() =>
                    setExpandedOwner(expandedOwner === owner.ownerId ? null : owner.ownerId)
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <RankBadge rank={index + 1} />
                      <span className="font-semibold text-[var(--chalk-text)]">
                        {owner.ownerName}
                      </span>
                      <span className="text-xs text-[var(--chalk-muted)]">
                        {expandedOwner === owner.ownerId ? "▼" : "▶"}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-[var(--chalk-green)]">
                      {totalEV.toFixed(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-[var(--chalk-muted)]">Actual</div>
                      <div className="text-[var(--chalk-text)]">
                        {owner.actualPoints.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--chalk-muted)]">+EV</div>
                      <div className="text-[var(--chalk-blue)]">
                        +{owner.totalRemainingEV.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--chalk-muted)]">Active</div>
                      <div>
                        <span className="text-[var(--chalk-green)]">{owner.activePlayers}</span>
                        <span className="text-[var(--chalk-muted)]">/</span>
                        <span className="text-red-400">{owner.eliminatedPlayers}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--chalk-border)]">
                  <th className="text-left py-2 px-2 text-[var(--chalk-muted)]">Rank</th>
                  <th className="text-left py-2 px-2 text-[var(--chalk-muted)]">Owner</th>
                  <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">Actual</th>
                  <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">Remaining EV</th>
                  <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">Total EV</th>
                  <th className="text-center py-2 px-2 text-[var(--chalk-muted)]">Active</th>
                </tr>
              </thead>
              <tbody>
                {data.projections.map((owner, index) => {
                  const totalEV = owner.actualPoints + owner.totalRemainingEV;
                  return (
                    <tr
                      key={owner.ownerId}
                      className="border-b border-[var(--chalk-border)]/50 hover:bg-[var(--chalk-surface)] cursor-pointer"
                      onClick={() =>
                        setExpandedOwner(expandedOwner === owner.ownerId ? null : owner.ownerId)
                      }
                    >
                      <td className="py-3 px-2">
                        <RankBadge rank={index + 1} />
                      </td>
                      <td className="py-3 px-2 font-semibold text-[var(--chalk-text)]">
                        <div className="flex items-center gap-2">
                          {owner.ownerName}
                          <span className="text-xs text-[var(--chalk-muted)]">
                            {expandedOwner === owner.ownerId ? "▼" : "▶"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-[var(--chalk-text)]">
                        {owner.actualPoints.toFixed(1)}
                      </td>
                      <td className="py-3 px-2 text-right text-[var(--chalk-blue)]">
                        +{owner.totalRemainingEV.toFixed(1)}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[var(--chalk-green)] text-lg">
                        {totalEV.toFixed(1)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-[var(--chalk-green)]">{owner.activePlayers}</span>
                        <span className="text-[var(--chalk-muted)]">/</span>
                        <span className="text-red-400">{owner.eliminatedPlayers}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Owner Details */}
      {expandedOwner && (
        <OwnerPlayoffDetails
          owner={data.projections.find((o) => o.ownerId === expandedOwner)!}
          remainingWeeks={data.remainingWeeks}
        />
      )}

      {/* All Owner Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.projections.map((owner, rank) => (
          <OwnerPlayoffCard key={owner.ownerId} owner={owner} rank={rank} />
        ))}
      </div>
    </>
  );
}

// Owner Playoff Card Component
function OwnerPlayoffCard({ owner, rank }: { owner: OwnerPlayoffProjection; rank: number }) {
  const totalEV = owner.actualPoints + owner.totalRemainingEV;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RankBadge rank={rank + 1} />
            <h3 className="text-lg font-bold text-[var(--chalk-yellow)]">{owner.ownerName}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--chalk-green)]">{totalEV.toFixed(1)}</div>
            <div className="text-xs text-[var(--chalk-muted)]">Total EV</div>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-[var(--chalk-muted)] mt-1">
          <span>Actual: {owner.actualPoints.toFixed(1)}</span>
          <span className="text-[var(--chalk-blue)]">
            +{owner.totalRemainingEV.toFixed(1)} remaining
          </span>
          <span>
            <span className="text-[var(--chalk-green)]">{owner.activePlayers}</span> active /
            <span className="text-red-400 ml-1">{owner.eliminatedPlayers}</span> out
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {owner.players.slice(0, 9).map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--chalk-surface)] ${
                player.totalRemainingEV === 0 ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-8 text-xs font-medium text-[var(--chalk-muted)]">
                  {player.slot}
                </span>
                <Link
                  href={`/player/${player.id}`}
                  className="text-sm text-[var(--chalk-text)] hover:text-[var(--chalk-blue)] transition-colors truncate"
                >
                  {player.name}
                </Link>
                {player.team && (
                  <span className="text-xs text-[var(--chalk-muted)]">{player.team}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--chalk-text)] w-10 text-right">
                  {player.actualPoints.toFixed(1)}
                </span>
                <span className="text-[var(--chalk-muted)] w-10 text-right text-xs">
                  {player.avgPointsPerGame.toFixed(1)}/g
                </span>
                {player.champProb !== null && (
                  <span className="text-purple-400 w-10 text-right text-xs">
                    {(player.champProb * 100).toFixed(0)}%
                  </span>
                )}
                <span className="text-[var(--chalk-green)] w-12 text-right font-medium">
                  +{player.totalRemainingEV.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 pt-2 border-t border-[var(--chalk-border)]/50 text-xs text-[var(--chalk-muted)]">
          <span>Actual</span>
          <span>Avg/G</span>
          <span className="text-purple-400">Champ%</span>
          <span className="text-[var(--chalk-green)]">Rem EV</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Expanded Owner Details
function OwnerPlayoffDetails({
  owner,
  remainingWeeks,
}: {
  owner: OwnerPlayoffProjection;
  remainingWeeks: number[];
}) {
  return (
    <Card className="border-2 border-[var(--chalk-yellow)]">
      <CardHeader>
        <h3 className="text-xl font-bold text-[var(--chalk-yellow)]">
          {owner.ownerName} - Week by Week Breakdown
        </h3>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--chalk-border)]">
                <th className="text-left py-2 px-2 text-[var(--chalk-muted)]">Player</th>
                <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">Actual</th>
                <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">Avg/G</th>
                {remainingWeeks.map((w) => (
                  <th key={w} className="text-right py-2 px-2 text-[var(--chalk-muted)]">
                    {weekNames[w]}
                  </th>
                ))}
                <th className="text-right py-2 px-2 text-[var(--chalk-muted)]">Total EV</th>
              </tr>
            </thead>
            <tbody>
              {owner.players.map((player) => (
                <tr
                  key={player.id}
                  className={`border-b border-[var(--chalk-border)]/50 ${
                    player.totalRemainingEV === 0 ? "opacity-50" : ""
                  }`}
                >
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--chalk-muted)]">{player.slot}</span>
                      <Link
                        href={`/player/${player.id}`}
                        className="text-[var(--chalk-text)] hover:text-[var(--chalk-blue)]"
                      >
                        {player.name}
                      </Link>
                      {player.team && (
                        <span className="text-xs text-[var(--chalk-muted)]">{player.team}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right text-[var(--chalk-text)]">
                    {player.actualPoints.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 text-right text-[var(--chalk-muted)]">
                    {player.avgPointsPerGame.toFixed(1)}
                  </td>
                  {remainingWeeks.map((w) => {
                    const weekData = player.weeklyBreakdown.find((wb) => wb.week === w);
                    return (
                      <td key={w} className="py-2 px-2 text-right">
                        {weekData ? (
                          <div>
                            <span className="text-[var(--chalk-green)]">
                              {weekData.expectedValue.toFixed(1)}
                            </span>
                            <div className="text-xs text-[var(--chalk-muted)]">
                              {(weekData.advanceProb * 100).toFixed(0)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--chalk-muted)]">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-right font-bold text-[var(--chalk-green)]">
                    {player.totalRemainingEV.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Single Week View Component (Original)
function SingleWeekView({ data, odds }: { data: SingleWeekData; odds: OddsData | null }) {
  const isWildCard = data.week === 1;

  return (
    <>
      {/* Week Info */}
      {data.byeTeams && data.byeTeams.length > 0 && isWildCard && (
        <div className="flex flex-wrap gap-4 text-xs bg-[var(--chalk-surface)] p-2 rounded">
          <span>
            <span className="text-[var(--chalk-muted)]">Bye Teams:</span>{" "}
            <span className="text-purple-400">{data.byeTeams.join(", ")}</span>
            <span className="text-[var(--chalk-muted)] ml-1">(skip Wild Card)</span>
          </span>
          {data.eliminatedTeams && data.eliminatedTeams.length > 0 && (
            <span>
              <span className="text-[var(--chalk-muted)]">Eliminated:</span>{" "}
              <span className="text-red-400">{data.eliminatedTeams.join(", ")}</span>
            </span>
          )}
        </div>
      )}

      {/* Team Odds Summary */}
      {odds && odds.odds.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-[var(--chalk-text)]">Matchups</h2>
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
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {data.projections.map((owner, index) => (
              <div
                key={owner.ownerId}
                className={`p-3 rounded-lg ${
                  index === 0
                    ? "bg-yellow-900/30 border border-yellow-500/30"
                    : "bg-[rgba(0,0,0,0.2)] border border-[var(--chalk-muted)]/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RankBadge rank={index + 1} />
                    <span className="font-semibold text-[var(--chalk-text)]">
                      {owner.ownerName}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-[var(--chalk-green)]">
                    {owner.totalExpectedValue.toFixed(1)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-[var(--chalk-muted)]">Actual</div>
                    <div className="text-[var(--chalk-text)]">{owner.actualPoints.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--chalk-muted)]">Projected</div>
                    <div className="text-[var(--chalk-blue)]">
                      {owner.projectedPoints.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--chalk-muted)]">EV</div>
                    <div className="text-[var(--chalk-muted)]">
                      {owner.expectedValue.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
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
                {data.projections.map((owner, index) => (
                  <tr
                    key={owner.ownerId}
                    className="border-b border-[var(--chalk-border)]/50 hover:bg-[var(--chalk-surface)]"
                  >
                    <td className="py-2 px-2">
                      <RankBadge rank={index + 1} />
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

      {/* Owner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.projections.map((owner, rank) => (
          <Card key={owner.ownerId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RankBadge rank={rank + 1} />
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
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {owner.players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--chalk-surface)] ${
                      player.isEliminated ? "opacity-50" : ""
                    }`}
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
                      {player.isEliminated && (
                        <span className="text-xs text-red-400 px-1 py-0.5 bg-red-900/30 rounded">
                          OUT
                        </span>
                      )}
                      {player.isByeWeek && (
                        <span className="text-xs text-purple-400 px-1 py-0.5 bg-purple-900/30 rounded">
                          BYE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-[var(--chalk-text)] w-12 text-right">
                        {player.actualPoints.toFixed(1)}
                      </span>
                      <span
                        className={`w-12 text-right font-medium ${
                          player.isByeWeek
                            ? "text-purple-400"
                            : player.expectedValue !== null
                              ? "text-[var(--chalk-green)]"
                              : "text-[var(--chalk-muted)]"
                        }`}
                      >
                        {player.isByeWeek
                          ? "BYE"
                          : player.expectedValue !== null
                            ? player.expectedValue.toFixed(1)
                            : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// Rank Badge Component
function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
        rank === 1
          ? "bg-yellow-500/20 text-yellow-400"
          : rank === 2
            ? "bg-gray-400/20 text-gray-300"
            : rank === 3
              ? "bg-amber-600/20 text-amber-500"
              : "bg-[var(--chalk-surface)] text-[var(--chalk-muted)]"
      }`}
    >
      {rank}
    </span>
  );
}
