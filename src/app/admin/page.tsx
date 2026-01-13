"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";

// Types
interface HealthData {
  status: "healthy" | "warning" | "error";
  lastSync: string | null;
  lastSyncAge: number | null;
  weekCoverage: {
    week: number;
    label: string;
    scoresCount: number;
    hasData: boolean;
  }[];
  stats: {
    totalPlayers: number;
    playersWithEspnId: number;
    playersWithoutEspnId: number;
    totalOwners: number;
    totalRosters: number;
    eliminatedTeams: number;
    activeTeams: number;
    playersOnActiveTeams: number;
    playersOnEliminatedTeams: number;
    unmatchedOnActiveTeams: number;
  };
  eliminatedTeamsList: string[];
  alerts: { type: "warning" | "error" | "info"; message: string }[];
}

interface RosterPlayer {
  rosterId: string;
  playerId: string;
  name: string;
  position: string;
  team: string | null;
  espnId: string | null;
  rosterSlot: string;
  totalPoints: number;
  isEliminated: boolean;
  hasEspnId: boolean;
}

interface RosterData {
  ownerId: string;
  ownerName: string;
  players: RosterPlayer[];
  totalPoints: number;
  activePlayers: number;
  totalPlayers: number;
}

interface UnmatchedPlayer {
  id: string;
  name: string;
  position: string;
  team: string | null;
  isRostered: boolean;
  isEliminated: boolean;
  ownerName: string | null;
  priority: number;
}

interface ESPNSearchResult {
  espnId: string;
  name: string;
  shortName: string;
  position: string | null;
  team: string | null;
  teamName: string | null;
}

// Health Dashboard Component
function HealthDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-[var(--chalk-muted)]">
          Loading health data...
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-400">
          Failed to load health data
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    healthy: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  const statusLabels = {
    healthy: "Healthy",
    warning: "Warning",
    error: "Error",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            System Health
            <span className={`w-3 h-3 rounded-full ${statusColors[health.status]}`} />
            <span
              className={`text-sm font-normal ${
                health.status === "healthy"
                  ? "text-green-400"
                  : health.status === "warning"
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {statusLabels[health.status]}
            </span>
          </CardTitle>
          {health.lastSync && (
            <span className="text-xs text-[var(--chalk-muted)]">
              Last sync:{" "}
              {health.lastSyncAge !== null
                ? `${health.lastSyncAge}m ago`
                : new Date(health.lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerts */}
        {health.alerts.length > 0 && (
          <div className="space-y-2">
            {health.alerts.map((alert, i) => (
              <div
                key={i}
                className={`text-xs px-3 py-2 rounded ${
                  alert.type === "warning"
                    ? "bg-yellow-900/30 text-yellow-400"
                    : alert.type === "error"
                      ? "bg-red-900/30 text-red-400"
                      : "bg-blue-900/30 text-blue-400"
                }`}
              >
                {alert.type === "warning" && "⚠️ "}
                {alert.type === "error" && "❌ "}
                {alert.type === "info" && "ℹ️ "}
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* Week Coverage */}
        <div>
          <div className="text-xs text-[var(--chalk-muted)] mb-2">Week Coverage</div>
          <div className="grid grid-cols-4 gap-2">
            {health.weekCoverage.map((week) => (
              <div
                key={week.week}
                className={`text-center p-2 rounded ${
                  week.hasData
                    ? "bg-green-900/30 border border-green-500/30"
                    : "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]"
                }`}
              >
                <div className="text-xs text-[var(--chalk-muted)]">{week.label}</div>
                <div
                  className={`text-lg font-bold ${week.hasData ? "text-green-400" : "text-[var(--chalk-muted)]"}`}
                >
                  {week.scoresCount}
                </div>
                <div className="text-[10px] text-[var(--chalk-muted)]">scores</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-[rgba(0,0,0,0.2)] rounded p-2">
            <div className="text-xl font-bold text-[var(--chalk-white)]">
              {health.stats.totalPlayers}
            </div>
            <div className="text-[10px] text-[var(--chalk-muted)]">Total Players</div>
          </div>
          <div className="bg-[rgba(0,0,0,0.2)] rounded p-2">
            <div className="text-xl font-bold text-green-400">{health.stats.playersWithEspnId}</div>
            <div className="text-[10px] text-[var(--chalk-muted)]">ESPN Matched</div>
          </div>
          <div className="bg-[rgba(0,0,0,0.2)] rounded p-2">
            <div className="text-xl font-bold text-[var(--chalk-white)]">
              {health.stats.activeTeams}
            </div>
            <div className="text-[10px] text-[var(--chalk-muted)]">Active Teams</div>
          </div>
          <div className="bg-[rgba(0,0,0,0.2)] rounded p-2">
            <div className="text-xl font-bold text-red-400">{health.stats.eliminatedTeams}</div>
            <div className="text-[10px] text-[var(--chalk-muted)]">Eliminated</div>
          </div>
        </div>

        {/* Eliminated Teams List */}
        {health.eliminatedTeamsList.length > 0 && (
          <div className="text-xs">
            <span className="text-[var(--chalk-muted)]">Eliminated: </span>
            <span className="text-red-400">{health.eliminatedTeamsList.join(", ")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Roster Management Component
function RosterManagement() {
  const [rosters, setRosters] = useState<RosterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  const fetchRosters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rosters?year=${CURRENT_SEASON_YEAR}`);
      const data = await res.json();
      setRosters(data.rosters || []);
    } catch (error) {
      console.error("Error fetching rosters:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRosters();
  }, [fetchRosters]);

  const handleRemovePlayer = async (rosterId: string) => {
    if (!confirm("Remove this player from the roster?")) return;

    try {
      const res = await fetch("/api/admin/rosters", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rosterId }),
      });

      if (res.ok) {
        fetchRosters();
      }
    } catch (error) {
      console.error("Error removing player:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-[var(--chalk-muted)]">
          Loading rosters...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roster Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rosters
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .map((roster) => (
            <div
              key={roster.ownerId}
              className="border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden"
            >
              {/* Owner Header - Clickable */}
              <button
                onClick={() =>
                  setExpandedOwner(expandedOwner === roster.ownerId ? null : roster.ownerId)
                }
                className="w-full px-4 py-3 flex items-center justify-between bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.3)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transform transition-transform ${expandedOwner === roster.ownerId ? "rotate-90" : ""}`}
                  >
                    ▶
                  </span>
                  <span className="font-bold text-[var(--chalk-white)]">{roster.ownerName}</span>
                  <span className="text-xs text-[var(--chalk-muted)]">
                    {roster.activePlayers}/{roster.totalPlayers} active
                  </span>
                </div>
                <span className="font-bold text-[var(--chalk-green)]">
                  {roster.totalPoints.toFixed(1)} pts
                </span>
              </button>

              {/* Expanded Player List */}
              {expandedOwner === roster.ownerId && (
                <div className="border-t border-[rgba(255,255,255,0.1)]">
                  {roster.players.map((player) => (
                    <div
                      key={player.rosterId}
                      className={`px-4 py-2 flex items-center justify-between text-sm border-b border-[rgba(255,255,255,0.05)] last:border-0 ${
                        player.isEliminated ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[var(--chalk-muted)] w-8">
                          {player.rosterSlot}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            player.position === "QB"
                              ? "bg-red-900/50 text-red-400"
                              : player.position === "RB"
                                ? "bg-green-900/50 text-green-400"
                                : player.position === "WR"
                                  ? "bg-blue-900/50 text-blue-400"
                                  : player.position === "TE"
                                    ? "bg-yellow-900/50 text-yellow-400"
                                    : player.position === "K"
                                      ? "bg-purple-900/50 text-purple-400"
                                      : "bg-orange-900/50 text-orange-400"
                          }`}
                        >
                          {player.position}
                        </span>
                        <span className="text-[var(--chalk-white)]">{player.name}</span>
                        {player.team && (
                          <span className="text-xs text-[var(--chalk-muted)]">{player.team}</span>
                        )}
                        {!player.hasEspnId && (
                          <span className="text-[10px] bg-yellow-900/50 text-yellow-400 px-1 rounded">
                            No ESPN ID
                          </span>
                        )}
                        {player.isEliminated && (
                          <span className="text-[10px] bg-red-900/50 text-red-400 px-1 rounded">
                            OUT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono ${player.totalPoints > 0 ? "text-[var(--chalk-green)]" : "text-[var(--chalk-muted)]"}`}
                        >
                          {player.totalPoints.toFixed(1)}
                        </span>
                        <button
                          onClick={() => handleRemovePlayer(player.rosterId)}
                          className="text-red-400 hover:text-red-300 text-xs"
                          title="Remove from roster"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

// Player Matching Tool Component
function PlayerMatchingTool() {
  const [unmatchedPlayers, setUnmatchedPlayers] = useState<UnmatchedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ESPNSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<UnmatchedPlayer | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchUnmatched = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/players/unmatched?rostered=true");
      const data = await res.json();
      setUnmatchedPlayers(data.players || []);
    } catch (error) {
      console.error("Error fetching unmatched:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnmatched();
  }, [fetchUnmatched]);

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/admin/espn/search?name=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Error searching ESPN:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAssignEspnId = async (playerId: string, espnId: string, team?: string | null) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ espnId, team: team || undefined }),
      });

      if (res.ok) {
        setSelectedPlayer(null);
        setSearchQuery("");
        setSearchResults([]);
        fetchUnmatched();
      }
    } catch (error) {
      console.error("Error updating player:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-[var(--chalk-muted)]">
          Loading unmatched players...
        </CardContent>
      </Card>
    );
  }

  const activeUnmatched = unmatchedPlayers.filter((p) => !p.isEliminated);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Player Matching Tool</span>
          {activeUnmatched.length > 0 && (
            <span className="text-sm font-normal text-yellow-400">
              {activeUnmatched.length} on active teams
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {unmatchedPlayers.length === 0 ? (
          <div className="text-center text-green-400 py-4">
            ✓ All rostered players have ESPN IDs
          </div>
        ) : (
          <>
            {/* Unmatched Players List */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {unmatchedPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                    selectedPlayer?.id === player.id
                      ? "bg-[var(--chalk-blue)]/20 border border-[var(--chalk-blue)]/50"
                      : "bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.3)]"
                  } ${player.isEliminated ? "opacity-50" : ""}`}
                  onClick={() => {
                    setSelectedPlayer(player);
                    setSearchQuery(player.name);
                    handleSearch(player.name);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        player.priority === 1
                          ? "bg-yellow-900/50 text-yellow-400"
                          : "bg-[rgba(255,255,255,0.1)] text-[var(--chalk-muted)]"
                      }`}
                    >
                      {player.position}
                    </span>
                    <span className="text-[var(--chalk-white)]">{player.name}</span>
                    {player.team && (
                      <span className="text-xs text-[var(--chalk-muted)]">{player.team}</span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--chalk-muted)]">{player.ownerName}</span>
                </div>
              ))}
            </div>

            {/* Search Section */}
            {selectedPlayer && (
              <div className="border-t border-[rgba(255,255,255,0.1)] pt-4 space-y-3">
                <div className="text-sm text-[var(--chalk-white)]">
                  Finding ESPN match for: <span className="font-bold">{selectedPlayer.name}</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    placeholder="Search ESPN..."
                    className="flex-1 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-sm text-[var(--chalk-white)] placeholder:text-[var(--chalk-muted)]"
                  />
                  <button
                    onClick={() => handleSearch(searchQuery)}
                    disabled={searching}
                    className="px-4 py-2 bg-[var(--chalk-blue)] hover:bg-[var(--chalk-blue)]/80 rounded text-sm font-medium disabled:opacity-50"
                  >
                    {searching ? "..." : "Search"}
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map((result) => (
                      <div
                        key={result.espnId}
                        className="flex items-center justify-between px-3 py-2 bg-[rgba(0,0,0,0.2)] rounded hover:bg-[rgba(0,0,0,0.3)]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--chalk-white)]">{result.name}</span>
                          {result.position && (
                            <span className="text-xs text-[var(--chalk-muted)]">
                              {result.position}
                            </span>
                          )}
                          {result.team && (
                            <span className="text-xs text-[var(--chalk-muted)]">{result.team}</span>
                          )}
                          <span className="text-[10px] text-[var(--chalk-muted)]">
                            ID: {result.espnId}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleAssignEspnId(selectedPlayer.id, result.espnId, result.team)
                          }
                          disabled={updating}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium disabled:opacity-50"
                        >
                          {updating ? "..." : "Use"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                  <div className="text-sm text-[var(--chalk-muted)] text-center py-2">
                    No ESPN results found
                  </div>
                )}

                {/* Manual Entry Option */}
                <div className="pt-2 border-t border-[rgba(255,255,255,0.1)]">
                  <ManualEspnIdEntry
                    playerId={selectedPlayer.id}
                    onSuccess={() => {
                      setSelectedPlayer(null);
                      fetchUnmatched();
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Manual ESPN ID Entry Component
function ManualEspnIdEntry({ playerId, onSuccess }: { playerId: string; onSuccess: () => void }) {
  const [espnId, setEspnId] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async () => {
    if (!espnId.trim()) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ espnId: espnId.trim() }),
      });

      if (res.ok) {
        setEspnId("");
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating player:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={espnId}
        onChange={(e) => setEspnId(e.target.value)}
        placeholder="Enter ESPN ID manually..."
        className="flex-1 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-sm text-[var(--chalk-white)] placeholder:text-[var(--chalk-muted)]"
      />
      <button
        onClick={handleSubmit}
        disabled={updating || !espnId.trim()}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium disabled:opacity-50"
      >
        {updating ? "..." : "Set ID"}
      </button>
    </div>
  );
}

// Sync Actions Component (moved from old admin)
function SyncActions() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: CURRENT_SEASON_YEAR,
          weeks: [1, 2, 3, 5],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(
          `Synced ${data.data?.scoresUpdated || 0} scores from ${data.data?.gamesFound || 0} games`
        );
      } else {
        setResult(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--chalk-muted)]">
          Manually trigger ESPN data sync. This runs automatically via cron every 15 minutes.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full chalk-button chalk-button-blue"
        >
          {syncing ? "Syncing..." : "Sync ESPN Data"}
        </button>
        {result && (
          <div
            className={`text-sm p-2 rounded ${
              result.startsWith("Error")
                ? "bg-red-900/30 text-red-400"
                : "bg-green-900/30 text-green-400"
            }`}
          >
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Admin Page
export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--chalk-yellow)] chalk-text">Admin Dashboard</h1>

      {/* Health Dashboard */}
      <HealthDashboard />

      {/* Two Column Layout for smaller cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player Matching Tool */}
        <PlayerMatchingTool />

        {/* Sync Actions */}
        <SyncActions />
      </div>

      {/* Roster Management - Full Width */}
      <RosterManagement />
    </div>
  );
}
