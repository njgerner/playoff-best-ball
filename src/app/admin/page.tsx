"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [liveScores, setLiveScores] = useState<Record<string, unknown> | null>(null);
  const [loadingScores, setLoadingScores] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: new Date().getFullYear(),
          weeks: [1, 2, 3, 5],
        }),
      });

      const result = await response.json();
      setSyncResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setSyncResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchLive = async () => {
    setLoadingScores(true);
    setLiveScores(null);

    try {
      const response = await fetch("/api/scores");
      const result = await response.json();
      setLiveScores(result);
    } catch (error) {
      setLiveScores({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoadingScores(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--chalk-yellow)] chalk-text">Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sync Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Scores to Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--chalk-muted)]">
              Fetch the latest scores from ESPN and save them to the database. This updates all
              player scores for playoff weeks 1, 2, 3, and 5.
            </p>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full chalk-button chalk-button-blue"
            >
              {syncing ? "Syncing..." : "Sync Scores"}
            </button>

            {syncResult && (
              <pre className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg text-xs overflow-auto max-h-64 text-[var(--chalk-white)] font-[var(--font-chalk-mono)]">
                {syncResult}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Live Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Fetch Live Scores (No DB)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--chalk-muted)]">
              Fetch live scores directly from ESPN without saving to database. Useful for testing
              the ESPN API integration.
            </p>

            <button
              onClick={handleFetchLive}
              disabled={loadingScores}
              className="w-full chalk-button chalk-button-green"
            >
              {loadingScores ? "Fetching..." : "Fetch Live Scores"}
            </button>

            {liveScores && (
              <pre className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg text-xs overflow-auto max-h-64 text-[var(--chalk-white)] font-[var(--font-chalk-mono)]">
                {JSON.stringify(liveScores, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 chalk-rank chalk-rank-1 flex items-center justify-center">
                1
              </span>
              <div>
                <p className="font-medium text-[var(--chalk-white)]">Create Neon Database</p>
                <p className="text-[var(--chalk-muted)]">
                  Go to{" "}
                  <a
                    href="https://neon.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--chalk-blue)] hover:underline"
                  >
                    neon.tech
                  </a>{" "}
                  and create a new database
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 chalk-rank chalk-rank-2 flex items-center justify-center">
                2
              </span>
              <div>
                <p className="font-medium text-[var(--chalk-white)]">
                  Configure Environment Variables
                </p>
                <p className="text-[var(--chalk-muted)]">
                  Add{" "}
                  <code className="bg-[rgba(0,0,0,0.3)] px-1 rounded text-[var(--chalk-pink)]">
                    DATABASE_URL
                  </code>{" "}
                  and{" "}
                  <code className="bg-[rgba(0,0,0,0.3)] px-1 rounded text-[var(--chalk-pink)]">
                    DIRECT_URL
                  </code>{" "}
                  to your{" "}
                  <code className="bg-[rgba(0,0,0,0.3)] px-1 rounded text-[var(--chalk-pink)]">
                    .env
                  </code>{" "}
                  file
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 chalk-rank chalk-rank-3 flex items-center justify-center">
                3
              </span>
              <div>
                <p className="font-medium text-[var(--chalk-white)]">Push Database Schema</p>
                <p className="text-[var(--chalk-muted)]">
                  Run{" "}
                  <code className="bg-[rgba(0,0,0,0.3)] px-1 rounded text-[var(--chalk-pink)]">
                    npx prisma db push
                  </code>{" "}
                  to create tables
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 chalk-rank flex items-center justify-center">
                4
              </span>
              <div>
                <p className="font-medium text-[var(--chalk-white)]">Seed Rosters</p>
                <p className="text-[var(--chalk-muted)]">
                  Run{" "}
                  <code className="bg-[rgba(0,0,0,0.3)] px-1 rounded text-[var(--chalk-pink)]">
                    npx prisma db seed
                  </code>{" "}
                  to populate owners and rosters
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 chalk-rank flex items-center justify-center">
                5
              </span>
              <div>
                <p className="font-medium text-[var(--chalk-white)]">Deploy to Vercel</p>
                <p className="text-[var(--chalk-muted)]">
                  Connect your repo to Vercel and add env variables in project settings
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
