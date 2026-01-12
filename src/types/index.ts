export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export type RosterSlot = "QB" | "RB1" | "RB2" | "WR1" | "WR2" | "TE" | "FLEX" | "K" | "DST";

export interface ScoringRules {
  passYardsPerPoint: number;
  passTd: number;
  passInt: number;
  rushYardsPerPoint: number;
  rushTd: number;
  recYardsPerPoint: number;
  recTd: number;
  ppr: number;
  twoPtConv: number;
  fumbleLost: number;
  returnTd: number;
  fg0_19: number;
  fg20_29: number;
  fg30_39: number;
  fg40_49: number;
  fg50Plus: number;
  fgMiss: number;
  xpMade: number;
  xpMiss: number;
  sack: number;
  defInt: number;
  fumRec: number;
  dstTd: number;
  safety: number;
  block: number;
  pa0: number;
  pa1_6: number;
  pa7_13: number;
  pa14_20: number;
  pa21_27: number;
  pa28_34: number;
  pa35Plus: number;
}

export interface PlayerStats {
  passYards: number;
  passTd: number;
  passInt: number;
  rushYards: number;
  rushTd: number;
  recYards: number;
  recTd: number;
  receptions: number;
  twoPtConv: number;
  fumblesLost: number;
  returnTd: number;
  // Kicking
  fgMade: { distance: number }[];
  fgMissed: { distance: number }[];
  xpMade: number;
  xpMissed: number;
  // Defense
  sacks: number;
  interceptions: number;
  fumblesRecovered: number;
  defensiveTd: number;
  safeties: number;
  blockedKicks: number;
  pointsAllowed: number;
}

export interface PlayerWithScore {
  id: string;
  name: string;
  position: Position;
  team: string | null;
  totalPoints: number;
  weeklyScores: { week: number; points: number }[];
}

export interface OwnerWithRoster {
  id: string;
  name: string;
  roster: {
    slot: RosterSlot;
    player: PlayerWithScore;
  }[];
  totalPoints: number;
  bestBallPoints: number;
}

export interface LeaderboardEntry {
  rank: number;
  owner: {
    id: string;
    name: string;
  };
  totalPoints: number;
  bestBallPoints: number;
}

// ESPN API Types
export interface ESPNEvent {
  id: string;
  name: string;
  competitions: ESPNCompetition[];
}

export interface ESPNCompetition {
  id: string;
  competitors: ESPNCompetitor[];
}

export interface ESPNCompetitor {
  id: string;
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
  };
  score: string;
}

export interface ESPNBoxscore {
  teams: ESPNTeamBoxscore[];
  players: ESPNPlayerSection[];
}

export interface ESPNTeamBoxscore {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
  };
  statistics: ESPNStatistic[];
}

export interface ESPNPlayerSection {
  team: {
    id: string;
  };
  statistics: ESPNPlayerCategory[];
}

export interface ESPNPlayerCategory {
  name: string;
  labels: string[];
  athletes: ESPNAthlete[];
}

export interface ESPNAthlete {
  athlete: {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
  };
  stats: string[];
}

export interface ESPNStatistic {
  name: string;
  displayValue: string;
}

export interface ESPNScoringPlay {
  text: string;
  type?: {
    text: string;
  };
}
