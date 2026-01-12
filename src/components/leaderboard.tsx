"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface LeaderboardEntry {
  rank: number;
  name: string;
  totalPoints: number;
  weeklyPoints?: { week: number; points: number }[];
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  showWeeklyBreakdown?: boolean;
}

const rankColors = ["chalk-rank-1", "chalk-rank-2", "chalk-rank-3"];

export function Leaderboard({
  entries,
  title = "Leaderboard",
  showWeeklyBreakdown = false,
}: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="chalk-table">
            <thead>
              <tr>
                <th className="w-16">Rank</th>
                <th>Owner</th>
                {showWeeklyBreakdown && (
                  <>
                    <th className="text-center">WC</th>
                    <th className="text-center">DIV</th>
                    <th className="text-center">CONF</th>
                    <th className="text-center">SB</th>
                  </>
                )}
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.name}>
                  <td>
                    <span className={`chalk-rank ${index < 3 ? rankColors[index] : ""}`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="font-medium text-[var(--chalk-white)]">{entry.name}</td>
                  {showWeeklyBreakdown && entry.weeklyPoints && (
                    <>
                      {[1, 2, 3, 5].map((week) => {
                        const weekData = entry.weeklyPoints?.find((w) => w.week === week);
                        return (
                          <td key={week} className="text-center text-sm text-[var(--chalk-muted)]">
                            {weekData?.points.toFixed(1) ?? "-"}
                          </td>
                        );
                      })}
                    </>
                  )}
                  <td className="text-right">
                    <span className="text-xl font-bold text-[var(--chalk-green)] chalk-score">
                      {entry.totalPoints.toFixed(1)}
                    </span>
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
