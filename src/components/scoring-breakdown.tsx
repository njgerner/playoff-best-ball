"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface StatLine {
  label: string;
  value: number | string;
  calculation: string;
  points: number;
}

interface ScoringBreakdownProps {
  playerName: string;
  week: number;
  weekLabel: string;
  stats: {
    // Passing
    passYards?: number;
    passTd?: number;
    passInt?: number;
    // Rushing
    rushYards?: number;
    rushTd?: number;
    // Receiving
    recYards?: number;
    recTd?: number;
    receptions?: number;
    // Kicking
    fgPoints?: number;
    xpMade?: number;
    xpMissed?: number;
    // Misc
    twoPtConv?: number;
    fumblesLost?: number;
    // Defense
    sacks?: number;
    interceptions?: number;
    fumblesRecovered?: number;
    defensiveTd?: number;
    safeties?: number;
    pointsAllowed?: number;
  };
  totalPoints: number;
}

// Scoring rules for display
const RULES = {
  passYardsPerPoint: 30,
  passTd: 6,
  passInt: -2,
  rushYardsPerPoint: 10,
  rushTd: 6,
  recYardsPerPoint: 10,
  recTd: 6,
  ppr: 0.5,
  twoPtConv: 2,
  fumbleLost: -2,
  xpMade: 1,
  xpMiss: -1,
  sack: 1,
  defInt: 2,
  fumRec: 2,
  dstTd: 6,
  safety: 4,
};

function formatPoints(pts: number): string {
  if (pts === 0) return "0";
  const sign = pts > 0 ? "+" : "";
  return `${sign}${pts.toFixed(1)}`;
}

export function ScoringBreakdown({ weekLabel, stats, totalPoints }: ScoringBreakdownProps) {
  const statLines: StatLine[] = [];

  // Passing
  if (stats.passYards && stats.passYards > 0) {
    const pts = stats.passYards / RULES.passYardsPerPoint;
    statLines.push({
      label: "Passing Yards",
      value: stats.passYards,
      calculation: `${stats.passYards} ÷ ${RULES.passYardsPerPoint}`,
      points: pts,
    });
  }
  if (stats.passTd && stats.passTd > 0) {
    const pts = stats.passTd * RULES.passTd;
    statLines.push({
      label: "Passing TDs",
      value: stats.passTd,
      calculation: `${stats.passTd} × ${RULES.passTd}`,
      points: pts,
    });
  }
  if (stats.passInt && stats.passInt > 0) {
    const pts = stats.passInt * RULES.passInt;
    statLines.push({
      label: "Interceptions",
      value: stats.passInt,
      calculation: `${stats.passInt} × ${RULES.passInt}`,
      points: pts,
    });
  }

  // Rushing
  if (stats.rushYards && stats.rushYards > 0) {
    const pts = stats.rushYards / RULES.rushYardsPerPoint;
    statLines.push({
      label: "Rushing Yards",
      value: stats.rushYards,
      calculation: `${stats.rushYards} ÷ ${RULES.rushYardsPerPoint}`,
      points: pts,
    });
  }
  if (stats.rushTd && stats.rushTd > 0) {
    const pts = stats.rushTd * RULES.rushTd;
    statLines.push({
      label: "Rushing TDs",
      value: stats.rushTd,
      calculation: `${stats.rushTd} × ${RULES.rushTd}`,
      points: pts,
    });
  }

  // Receiving
  if (stats.receptions && stats.receptions > 0) {
    const pts = stats.receptions * RULES.ppr;
    statLines.push({
      label: "Receptions (PPR)",
      value: stats.receptions,
      calculation: `${stats.receptions} × ${RULES.ppr}`,
      points: pts,
    });
  }
  if (stats.recYards && stats.recYards > 0) {
    const pts = stats.recYards / RULES.recYardsPerPoint;
    statLines.push({
      label: "Receiving Yards",
      value: stats.recYards,
      calculation: `${stats.recYards} ÷ ${RULES.recYardsPerPoint}`,
      points: pts,
    });
  }
  if (stats.recTd && stats.recTd > 0) {
    const pts = stats.recTd * RULES.recTd;
    statLines.push({
      label: "Receiving TDs",
      value: stats.recTd,
      calculation: `${stats.recTd} × ${RULES.recTd}`,
      points: pts,
    });
  }

  // Kicking
  if (stats.fgPoints && stats.fgPoints !== 0) {
    statLines.push({
      label: "Field Goals",
      value: "-",
      calculation: "Distance-based scoring",
      points: stats.fgPoints,
    });
  }
  if (stats.xpMade && stats.xpMade > 0) {
    const pts = stats.xpMade * RULES.xpMade;
    statLines.push({
      label: "Extra Points Made",
      value: stats.xpMade,
      calculation: `${stats.xpMade} × ${RULES.xpMade}`,
      points: pts,
    });
  }
  if (stats.xpMissed && stats.xpMissed > 0) {
    const pts = stats.xpMissed * RULES.xpMiss;
    statLines.push({
      label: "Extra Points Missed",
      value: stats.xpMissed,
      calculation: `${stats.xpMissed} × ${RULES.xpMiss}`,
      points: pts,
    });
  }

  // Miscellaneous
  if (stats.twoPtConv && stats.twoPtConv > 0) {
    const pts = stats.twoPtConv * RULES.twoPtConv;
    statLines.push({
      label: "2-Point Conversions",
      value: stats.twoPtConv,
      calculation: `${stats.twoPtConv} × ${RULES.twoPtConv}`,
      points: pts,
    });
  }
  if (stats.fumblesLost && stats.fumblesLost > 0) {
    const pts = stats.fumblesLost * RULES.fumbleLost;
    statLines.push({
      label: "Fumbles Lost",
      value: stats.fumblesLost,
      calculation: `${stats.fumblesLost} × ${RULES.fumbleLost}`,
      points: pts,
    });
  }

  // Defense
  if (stats.sacks && stats.sacks > 0) {
    const pts = stats.sacks * RULES.sack;
    statLines.push({
      label: "Sacks",
      value: stats.sacks,
      calculation: `${stats.sacks} × ${RULES.sack}`,
      points: pts,
    });
  }
  if (stats.interceptions && stats.interceptions > 0) {
    const pts = stats.interceptions * RULES.defInt;
    statLines.push({
      label: "Interceptions (DEF)",
      value: stats.interceptions,
      calculation: `${stats.interceptions} × ${RULES.defInt}`,
      points: pts,
    });
  }
  if (stats.fumblesRecovered && stats.fumblesRecovered > 0) {
    const pts = stats.fumblesRecovered * RULES.fumRec;
    statLines.push({
      label: "Fumbles Recovered",
      value: stats.fumblesRecovered,
      calculation: `${stats.fumblesRecovered} × ${RULES.fumRec}`,
      points: pts,
    });
  }
  if (stats.defensiveTd && stats.defensiveTd > 0) {
    const pts = stats.defensiveTd * RULES.dstTd;
    statLines.push({
      label: "Defensive TDs",
      value: stats.defensiveTd,
      calculation: `${stats.defensiveTd} × ${RULES.dstTd}`,
      points: pts,
    });
  }
  if (stats.safeties && stats.safeties > 0) {
    const pts = stats.safeties * RULES.safety;
    statLines.push({
      label: "Safeties",
      value: stats.safeties,
      calculation: `${stats.safeties} × ${RULES.safety}`,
      points: pts,
    });
  }
  if (stats.pointsAllowed !== undefined) {
    let pts = 0;
    let paLabel = "";
    if (stats.pointsAllowed === 0) {
      pts = 10;
      paLabel = "0 pts";
    } else if (stats.pointsAllowed <= 6) {
      pts = 7;
      paLabel = "1-6 pts";
    } else if (stats.pointsAllowed <= 13) {
      pts = 4;
      paLabel = "7-13 pts";
    } else if (stats.pointsAllowed <= 20) {
      pts = 1;
      paLabel = "14-20 pts";
    } else if (stats.pointsAllowed <= 27) {
      pts = 0;
      paLabel = "21-27 pts";
    } else if (stats.pointsAllowed <= 34) {
      pts = -1;
      paLabel = "28-34 pts";
    } else {
      pts = -3;
      paLabel = "35+ pts";
    }

    statLines.push({
      label: "Points Allowed",
      value: stats.pointsAllowed,
      calculation: paLabel,
      points: pts,
    });
  }

  if (statLines.length === 0) {
    return (
      <Card className="bg-[rgba(0,0,0,0.2)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex justify-between">
            <span className="text-[var(--chalk-white)]">{weekLabel}</span>
            <span className="text-[var(--chalk-muted)]">0.0 pts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--chalk-muted)]">No stats recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between">
          <span className="text-[var(--chalk-white)]">{weekLabel}</span>
          <span className="text-[var(--chalk-green)] font-bold chalk-score">
            {totalPoints.toFixed(1)} pts
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dashed border-[rgba(255,255,255,0.2)]">
              <th className="py-1 text-left font-medium text-[var(--chalk-muted)]">Stat</th>
              <th className="py-1 text-center font-medium text-[var(--chalk-muted)]">Value</th>
              <th className="py-1 text-center font-medium text-[var(--chalk-muted)]">
                Calculation
              </th>
              <th className="py-1 text-right font-medium text-[var(--chalk-muted)]">Points</th>
            </tr>
          </thead>
          <tbody>
            {statLines.map((line, i) => (
              <tr
                key={i}
                className="border-b border-dashed border-[rgba(255,255,255,0.1)] last:border-0"
              >
                <td className="py-2 text-[var(--chalk-white)]">{line.label}</td>
                <td className="py-2 text-center font-mono text-[var(--chalk-white)]">
                  {line.value}
                </td>
                <td className="py-2 text-center text-[var(--chalk-muted)] font-mono text-xs">
                  {line.calculation}
                </td>
                <td
                  className={`py-2 text-right font-semibold chalk-score ${
                    line.points > 0
                      ? "text-[var(--chalk-green)]"
                      : line.points < 0
                        ? "text-[var(--chalk-red)]"
                        : "text-[var(--chalk-muted)]"
                  }`}
                >
                  {formatPoints(line.points)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-dashed border-[rgba(255,255,255,0.3)]">
              <td colSpan={3} className="py-2 font-semibold text-[var(--chalk-white)]">
                Total
              </td>
              <td className="py-2 text-right font-bold text-[var(--chalk-green)] chalk-score">
                {totalPoints.toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}
