"use client";

import Link from "next/link";

interface PlayerRowProps {
  slot: string;
  name: string;
  points: number;
  playerId?: string;
  compact?: boolean;
  isEliminated?: boolean;
}

const slotClasses: Record<string, string> = {
  QB: "chalk-badge-qb",
  RB1: "chalk-badge-rb",
  RB2: "chalk-badge-rb",
  WR1: "chalk-badge-wr",
  WR2: "chalk-badge-wr",
  TE: "chalk-badge-te",
  FLEX: "chalk-badge-flex",
  K: "chalk-badge-k",
  DST: "chalk-badge-dst",
};

export function PlayerRow({
  slot,
  name,
  points,
  playerId,
  compact = false,
  isEliminated = false,
}: PlayerRowProps) {
  const badgeClass = slotClasses[slot] ?? "chalk-badge-flex";
  const displaySlot = slot.replace(/[0-9]/g, "");

  const scoreClass = isEliminated
    ? "text-[var(--chalk-muted)]"
    : points > 0
      ? "text-[var(--chalk-green)]"
      : points < 0
        ? "text-[var(--chalk-red)]"
        : "text-[var(--chalk-muted)]";

  const content = (
    <>
      <div className="flex items-center gap-2">
        <span
          className={`chalk-badge ${badgeClass} ${compact ? "text-xs px-1" : ""} ${isEliminated ? "opacity-50" : ""}`}
        >
          {displaySlot}
        </span>
        <span
          className={`font-medium ${compact ? "text-sm" : ""} ${isEliminated ? "text-[var(--chalk-muted)]" : "text-[var(--chalk-white)]"}`}
        >
          {name}
        </span>
        {isEliminated && (
          <span className="text-[8px] text-red-400 bg-red-900/30 px-1 py-0.5 rounded">OUT</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className={`font-bold chalk-score ${scoreClass} ${compact ? "text-sm" : ""}`}>
          {points.toFixed(1)}
        </span>
      </div>
    </>
  );

  const baseClasses = `flex items-center justify-between ${
    compact ? "py-1.5" : "py-2"
  } border-b border-dashed border-[rgba(255,255,255,0.1)] last:border-0 ${isEliminated ? "opacity-60" : ""}`;

  if (playerId) {
    return (
      <Link
        href={`/player/${playerId}`}
        className={`${baseClasses} hover:bg-[rgba(255,255,255,0.05)] rounded px-2 -mx-2 transition-colors cursor-pointer group`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`chalk-badge ${badgeClass} ${compact ? "text-xs px-1" : ""} ${isEliminated ? "opacity-50" : ""}`}
          >
            {displaySlot}
          </span>
          <span
            className={`font-medium group-hover:text-[var(--chalk-pink)] ${compact ? "text-sm" : ""} ${isEliminated ? "text-[var(--chalk-muted)]" : "text-[var(--chalk-white)]"}`}
          >
            {name}
          </span>
          {isEliminated && (
            <span className="text-[8px] text-red-400 bg-red-900/30 px-1 py-0.5 rounded">OUT</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold chalk-score ${scoreClass} ${compact ? "text-sm" : ""}`}>
            {points.toFixed(1)}
          </span>
          <span className="text-[var(--chalk-pink)] opacity-0 group-hover:opacity-100 transition-opacity text-sm">
            →
          </span>
        </div>
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
