"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface StatLine {
  label: string;
  value: number | string;
  calculation: string;
  points: number;
  // Extended calculation details for tooltip
  rawValue: number;
  multiplier: number;
  operation: "multiply" | "divide";
  explanation: string;
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

// Scoring rules for display - Half PPR league
const RULES = {
  // Passing
  passYardsPerPoint: 30,
  passTd: 6,
  passInt: -2,
  // Rushing
  rushYardsPerPoint: 10,
  rushTd: 6,
  // Receiving (Half PPR)
  recYardsPerPoint: 10,
  recTd: 6,
  ppr: 0.5,
  // Misc Offense
  twoPtConv: 2,
  fumbleLost: -2,
  returnTd: 6,
  // Kicking
  xpMade: 1,
  xpMiss: -1,
  // Defense
  sack: 1,
  defInt: 2,
  fumRec: 2,
  dstTd: 6,
  safety: 4,
  block: 2,
};

function formatPoints(pts: number): string {
  if (pts === 0) return "0";
  const sign = pts > 0 ? "+" : "";
  return `${sign}${pts.toFixed(1)}`;
}

// Tooltip component for calculation details
function CalculationTooltip({ line, children }: { line: StatLine; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block w-full">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-help"
      >
        {children}
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 p-4 bg-[#1a1a2e] border border-[var(--chalk-blue)] rounded-lg shadow-xl text-sm animate-in fade-in duration-150">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.1)] pb-2">
              <span className="font-bold text-[var(--chalk-yellow)]">{line.label}</span>
              <span className="text-[var(--chalk-green)] font-bold">
                {formatPoints(line.points)} pts
              </span>
            </div>

            {/* Calculation breakdown */}
            <div className="space-y-2">
              <div className="text-[var(--chalk-muted)] text-xs uppercase tracking-wide">
                Calculation
              </div>

              <div className="bg-[rgba(0,0,0,0.3)] rounded p-3 font-mono text-center">
                {line.operation === "divide" ? (
                  <div className="space-y-1">
                    <div className="text-[var(--chalk-white)] text-lg">{line.rawValue}</div>
                    <div className="border-t border-[var(--chalk-muted)] w-16 mx-auto"></div>
                    <div className="text-[var(--chalk-muted)]">{line.multiplier}</div>
                    <div className="text-[var(--chalk-blue)] mt-2">
                      = {(line.rawValue / line.multiplier).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[var(--chalk-white)] text-lg">{line.rawValue}</span>
                      <span className="text-[var(--chalk-muted)]">×</span>
                      <span className="text-[var(--chalk-white)] text-lg">{line.multiplier}</span>
                    </div>
                    <div className="text-[var(--chalk-blue)] mt-2">
                      = {(line.rawValue * line.multiplier).toFixed(1)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              <div className="text-[var(--chalk-muted)] text-xs uppercase tracking-wide">
                Scoring Rule
              </div>
              <p className="text-[var(--chalk-white)] text-xs leading-relaxed">
                {line.explanation}
              </p>
            </div>

            {/* Formula summary */}
            <div className="bg-[rgba(255,255,255,0.05)] rounded p-2 text-xs text-center text-[var(--chalk-muted)]">
              {line.operation === "divide"
                ? `${line.rawValue} yards ÷ ${line.multiplier} yards/point = ${line.points.toFixed(1)} points`
                : `${line.rawValue} ${line.label.toLowerCase()} × ${line.multiplier} points each = ${line.points.toFixed(1)} points`}
            </div>
          </div>

          {/* Arrow pointer */}
          <div className="absolute -top-2 left-4 w-3 h-3 bg-[#1a1a2e] border-l border-t border-[var(--chalk-blue)] transform rotate-45"></div>
        </div>
      )}
    </div>
  );
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
      rawValue: stats.passYards,
      multiplier: RULES.passYardsPerPoint,
      operation: "divide",
      explanation: `Every ${RULES.passYardsPerPoint} passing yards equals 1 fantasy point. This rewards quarterbacks for moving the ball through the air, though at a lower rate than rushing/receiving yards since passing is more common.`,
    });
  }
  if (stats.passTd && stats.passTd > 0) {
    const pts = stats.passTd * RULES.passTd;
    statLines.push({
      label: "Passing TDs",
      value: stats.passTd,
      calculation: `${stats.passTd} × ${RULES.passTd}`,
      points: pts,
      rawValue: stats.passTd,
      multiplier: RULES.passTd,
      operation: "multiply",
      explanation: `Each passing touchdown is worth ${RULES.passTd} points. Throwing a TD pass is one of the most valuable plays a quarterback can make.`,
    });
  }
  if (stats.passInt && stats.passInt > 0) {
    const pts = stats.passInt * RULES.passInt;
    statLines.push({
      label: "Interceptions",
      value: stats.passInt,
      calculation: `${stats.passInt} × ${RULES.passInt}`,
      points: pts,
      rawValue: stats.passInt,
      multiplier: RULES.passInt,
      operation: "multiply",
      explanation: `Each interception thrown costs ${Math.abs(RULES.passInt)} points. Turnovers are costly mistakes that can change games, so they result in negative fantasy points.`,
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
      rawValue: stats.rushYards,
      multiplier: RULES.rushYardsPerPoint,
      operation: "divide",
      explanation: `Every ${RULES.rushYardsPerPoint} rushing yards equals 1 fantasy point. Rushing yards are valued higher than passing yards because they're harder to gain.`,
    });
  }
  if (stats.rushTd && stats.rushTd > 0) {
    const pts = stats.rushTd * RULES.rushTd;
    statLines.push({
      label: "Rushing TDs",
      value: stats.rushTd,
      calculation: `${stats.rushTd} × ${RULES.rushTd}`,
      points: pts,
      rawValue: stats.rushTd,
      multiplier: RULES.rushTd,
      operation: "multiply",
      explanation: `Each rushing touchdown is worth ${RULES.rushTd} points. Punching the ball into the end zone on the ground is a high-value play.`,
    });
  }

  // Receiving
  if (stats.receptions && stats.receptions > 0) {
    const pts = stats.receptions * RULES.ppr;
    statLines.push({
      label: "Receptions",
      value: stats.receptions,
      calculation: `${stats.receptions} × ${RULES.ppr}`,
      points: pts,
      rawValue: stats.receptions,
      multiplier: RULES.ppr,
      operation: "multiply",
      explanation: `This is a Half-PPR (Point Per Reception) league. Each catch is worth ${RULES.ppr} points, rewarding receivers for their involvement in the offense beyond just yards gained.`,
    });
  }
  if (stats.recYards && stats.recYards > 0) {
    const pts = stats.recYards / RULES.recYardsPerPoint;
    statLines.push({
      label: "Receiving Yards",
      value: stats.recYards,
      calculation: `${stats.recYards} ÷ ${RULES.recYardsPerPoint}`,
      points: pts,
      rawValue: stats.recYards,
      multiplier: RULES.recYardsPerPoint,
      operation: "divide",
      explanation: `Every ${RULES.recYardsPerPoint} receiving yards equals 1 fantasy point. Like rushing, receiving yards are valued at a premium rate.`,
    });
  }
  if (stats.recTd && stats.recTd > 0) {
    const pts = stats.recTd * RULES.recTd;
    statLines.push({
      label: "Receiving TDs",
      value: stats.recTd,
      calculation: `${stats.recTd} × ${RULES.recTd}`,
      points: pts,
      rawValue: stats.recTd,
      multiplier: RULES.recTd,
      operation: "multiply",
      explanation: `Each receiving touchdown is worth ${RULES.recTd} points. Catching a TD in the end zone is one of the most exciting plays in football.`,
    });
  }

  // Kicking
  if (stats.fgPoints && stats.fgPoints !== 0) {
    statLines.push({
      label: "Field Goals",
      value: "-",
      calculation: "Distance-based scoring",
      points: stats.fgPoints,
      rawValue: stats.fgPoints,
      multiplier: 1,
      operation: "multiply",
      explanation: `Field goals are scored based on distance: 0-39 yards = 3 pts, 40-49 yards = 4 pts, 50+ yards = 5 pts. Only missed FGs under 40 yards cost 1 point (no penalty for missing 40+ yard attempts). Longer kicks are rewarded more because they're harder to make.`,
    });
  }
  if (stats.xpMade && stats.xpMade > 0) {
    const pts = stats.xpMade * RULES.xpMade;
    statLines.push({
      label: "Extra Points Made",
      value: stats.xpMade,
      calculation: `${stats.xpMade} × ${RULES.xpMade}`,
      points: pts,
      rawValue: stats.xpMade,
      multiplier: RULES.xpMade,
      operation: "multiply",
      explanation: `Each successful extra point kick is worth ${RULES.xpMade} point. These are typically high-percentage kicks from 33 yards out.`,
    });
  }
  if (stats.xpMissed && stats.xpMissed > 0) {
    const pts = stats.xpMissed * RULES.xpMiss;
    statLines.push({
      label: "Extra Points Missed",
      value: stats.xpMissed,
      calculation: `${stats.xpMissed} × ${RULES.xpMiss}`,
      points: pts,
      rawValue: stats.xpMissed,
      multiplier: RULES.xpMiss,
      operation: "multiply",
      explanation: `Each missed extra point costs ${Math.abs(RULES.xpMiss)} point. Missing a routine kick is penalized in fantasy scoring.`,
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
      rawValue: stats.twoPtConv,
      multiplier: RULES.twoPtConv,
      operation: "multiply",
      explanation: `Each successful 2-point conversion is worth ${RULES.twoPtConv} points. Both the passer and receiver get credit for a successful 2-point play.`,
    });
  }
  if (stats.fumblesLost && stats.fumblesLost > 0) {
    const pts = stats.fumblesLost * RULES.fumbleLost;
    statLines.push({
      label: "Fumbles Lost",
      value: stats.fumblesLost,
      calculation: `${stats.fumblesLost} × ${RULES.fumbleLost}`,
      points: pts,
      rawValue: stats.fumblesLost,
      multiplier: RULES.fumbleLost,
      operation: "multiply",
      explanation: `Each fumble lost costs ${Math.abs(RULES.fumbleLost)} points. Turnovers are costly mistakes that hurt both real and fantasy teams.`,
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
      rawValue: stats.sacks,
      multiplier: RULES.sack,
      operation: "multiply",
      explanation: `Each sack recorded by the defense is worth ${RULES.sack} point. Sacks disrupt the opponent's offense and often result in lost yardage.`,
    });
  }
  if (stats.interceptions && stats.interceptions > 0) {
    const pts = stats.interceptions * RULES.defInt;
    statLines.push({
      label: "Interceptions (DEF)",
      value: stats.interceptions,
      calculation: `${stats.interceptions} × ${RULES.defInt}`,
      points: pts,
      rawValue: stats.interceptions,
      multiplier: RULES.defInt,
      operation: "multiply",
      explanation: `Each interception by the defense is worth ${RULES.defInt} points. Turnovers are game-changing plays that reward the defense.`,
    });
  }
  if (stats.fumblesRecovered && stats.fumblesRecovered > 0) {
    const pts = stats.fumblesRecovered * RULES.fumRec;
    statLines.push({
      label: "Fumbles Recovered",
      value: stats.fumblesRecovered,
      calculation: `${stats.fumblesRecovered} × ${RULES.fumRec}`,
      points: pts,
      rawValue: stats.fumblesRecovered,
      multiplier: RULES.fumRec,
      operation: "multiply",
      explanation: `Each fumble recovered by the defense is worth ${RULES.fumRec} points. Creating and recovering turnovers is a key defensive skill.`,
    });
  }
  if (stats.defensiveTd && stats.defensiveTd > 0) {
    const pts = stats.defensiveTd * RULES.dstTd;
    statLines.push({
      label: "Defensive TDs",
      value: stats.defensiveTd,
      calculation: `${stats.defensiveTd} × ${RULES.dstTd}`,
      points: pts,
      rawValue: stats.defensiveTd,
      multiplier: RULES.dstTd,
      operation: "multiply",
      explanation: `Each defensive or special teams touchdown is worth ${RULES.dstTd} points. Pick-sixes, fumble returns, punt/kick returns for TDs all count.`,
    });
  }
  if (stats.safeties && stats.safeties > 0) {
    const pts = stats.safeties * RULES.safety;
    statLines.push({
      label: "Safeties",
      value: stats.safeties,
      calculation: `${stats.safeties} × ${RULES.safety}`,
      points: pts,
      rawValue: stats.safeties,
      multiplier: RULES.safety,
      operation: "multiply",
      explanation: `Each safety is worth ${RULES.safety} points. Safeties are rare plays where the defense tackles the ball carrier in their own end zone.`,
    });
  }
  if (stats.pointsAllowed !== undefined) {
    let pts = 0;
    let paLabel = "";
    let explanation = "";
    if (stats.pointsAllowed === 0) {
      pts = 10;
      paLabel = "0 pts";
      explanation = "A shutout! Holding the opponent scoreless earns the maximum 10 points.";
    } else if (stats.pointsAllowed <= 6) {
      pts = 7;
      paLabel = "1-6 pts";
      explanation =
        "Allowing only 1-6 points is an excellent defensive performance worth 7 points.";
    } else if (stats.pointsAllowed <= 13) {
      pts = 4;
      paLabel = "7-13 pts";
      explanation = "Allowing 7-13 points is a solid defensive game worth 4 points.";
    } else if (stats.pointsAllowed <= 20) {
      pts = 1;
      paLabel = "14-20 pts";
      explanation = "Allowing 14-20 points is an average defensive performance worth 1 point.";
    } else if (stats.pointsAllowed <= 27) {
      pts = 0;
      paLabel = "21-27 pts";
      explanation = "Allowing 21-27 points is below average and earns 0 points.";
    } else if (stats.pointsAllowed <= 34) {
      pts = -1;
      paLabel = "28-34 pts";
      explanation = "Allowing 28-34 points is a poor defensive showing that costs 1 point.";
    } else {
      pts = -3;
      paLabel = "35+ pts";
      explanation = "Allowing 35+ points is a bad defensive game that costs 3 points.";
    }

    statLines.push({
      label: "Points Allowed",
      value: stats.pointsAllowed,
      calculation: paLabel,
      points: pts,
      rawValue: stats.pointsAllowed,
      multiplier: pts,
      operation: "multiply",
      explanation: explanation,
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
              <CalculationTooltip key={i} line={line}>
                <tr className="border-b border-dashed border-[rgba(255,255,255,0.1)] last:border-0 hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  <td className="py-2 text-[var(--chalk-white)]">
                    <span className="flex items-center gap-1">
                      {line.label}
                      <svg
                        className="w-3 h-3 text-[var(--chalk-muted)] opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                  </td>
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
              </CalculationTooltip>
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
