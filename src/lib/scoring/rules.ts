import { ScoringRules } from "@/types";

/**
 * Default scoring rules matching the original App Script
 */
export const DEFAULT_SCORING_RULES: ScoringRules = {
  // Passing
  passYardsPerPoint: 30,
  passTd: 6,
  passInt: -2,

  // Rushing
  rushYardsPerPoint: 10,
  rushTd: 6,

  // Receiving
  recYardsPerPoint: 10,
  recTd: 6,
  ppr: 0.5,

  // Miscellaneous Offense
  twoPtConv: 2,
  fumbleLost: -2,
  returnTd: 6,

  // Kicking
  fg0_19: 3,
  fg20_29: 3,
  fg30_39: 3,
  fg40_49: 4,
  fg50Plus: 5,
  fgMiss: -1,
  xpMade: 1,
  xpMiss: -1,

  // Defense/Special Teams
  sack: 1,
  defInt: 2,
  fumRec: 2,
  dstTd: 6,
  safety: 4,
  block: 2,

  // Points Allowed
  pa0: 10,
  pa1_6: 7,
  pa7_13: 4,
  pa14_20: 1,
  pa21_27: 0,
  pa28_34: -1,
  pa35Plus: -3,
};

/**
 * Get field goal points based on distance
 */
export function getFieldGoalPoints(
  distance: number,
  made: boolean,
  rules: ScoringRules = DEFAULT_SCORING_RULES
): number {
  if (made) {
    if (distance < 20) return rules.fg0_19;
    if (distance < 30) return rules.fg20_29;
    if (distance < 40) return rules.fg30_39;
    if (distance < 50) return rules.fg40_49;
    return rules.fg50Plus;
  } else {
    return rules.fgMiss;
  }
}

/**
 * Get points allowed score for defense
 */
export function getPointsAllowedScore(
  pointsAllowed: number,
  rules: ScoringRules = DEFAULT_SCORING_RULES
): number {
  if (pointsAllowed === 0) return rules.pa0;
  if (pointsAllowed <= 6) return rules.pa1_6;
  if (pointsAllowed <= 13) return rules.pa7_13;
  if (pointsAllowed <= 20) return rules.pa14_20;
  if (pointsAllowed <= 27) return rules.pa21_27;
  if (pointsAllowed <= 34) return rules.pa28_34;
  return rules.pa35Plus;
}
