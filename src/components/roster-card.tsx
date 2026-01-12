"use client";

import { Card, CardContent, CardHeader } from "./ui/card";
import { PlayerRow } from "./player-row";

interface RosterPlayer {
  slot: string;
  name: string;
  points: number;
  playerId?: string;
  weeklyPoints?: { week: number; points: number }[];
}

interface RosterCardProps {
  ownerName: string;
  roster: RosterPlayer[];
  totalPoints: number;
  rank?: number;
  compact?: boolean;
}

const rankColors = [
  "chalk-rank-1", // 1st
  "chalk-rank-2", // 2nd
  "chalk-rank-3", // 3rd
];

export function RosterCard({
  ownerName,
  roster,
  totalPoints,
  rank,
  compact = false,
}: RosterCardProps) {
  const slotOrder = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "K", "DST"];
  const sortedRoster = [...roster].sort(
    (a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot)
  );

  const rankClass = rank && rank <= 3 ? rankColors[rank - 1] : "";

  return (
    <Card className="h-full">
      <CardHeader className={compact ? "pb-2" : ""}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {rank && <span className={`chalk-rank ${rankClass}`}>{rank}</span>}
            <h3
              className={`font-bold text-[var(--chalk-yellow)] chalk-text ${compact ? "text-lg" : "text-xl"}`}
            >
              {ownerName}
            </h3>
          </div>
          <span className="text-2xl font-bold text-[var(--chalk-green)] chalk-score">
            {totalPoints.toFixed(1)}
          </span>
        </div>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-0.5">
          {sortedRoster.map((player) => (
            <PlayerRow
              key={player.slot}
              slot={player.slot}
              name={player.name}
              points={player.points}
              playerId={player.playerId}
              compact={compact}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
