/**
 * ESPN API Response Types
 * These types represent the structure of ESPN's public API responses
 */

export interface ESPNScoreboardResponse {
  events: ESPNEvent[];
}

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
  team: ESPNTeam;
  score: string;
}

export interface ESPNTeam {
  id: string;
  displayName: string;
  abbreviation: string;
}

export interface ESPNSummaryResponse {
  header: {
    competitions: ESPNCompetition[];
  };
  boxscore: ESPNBoxscore;
  scoringPlays?: ESPNScoringPlay[];
}

export interface ESPNBoxscore {
  teams: ESPNTeamBoxscore[];
  players: ESPNPlayerSection[];
}

export interface ESPNTeamBoxscore {
  team: ESPNTeam;
  statistics: ESPNStatistic[];
}

export interface ESPNStatistic {
  name: string;
  displayValue: string;
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

export interface ESPNScoringPlay {
  text: string;
  type?: {
    text: string;
  };
  team?: {
    id: string;
  };
}

/**
 * Parsed player stats from ESPN data
 */
export interface ParsedPlayerStats {
  name: string;
  espnId?: string;
  position?: string;
  team?: string;
  stats: {
    passYards: number;
    passTd: number;
    passInt: number;
    rushYards: number;
    rushTd: number;
    recYards: number;
    recTd: number;
    receptions: number;
    fumblesLost: number;
    xpMade: number;
    xpMissed: number;
    // Additional points from scoring play parsing
    twoPtConv: number;
    fgPoints: number; // Accumulated FG points
  };
  totalPoints: number;
}

/**
 * Parsed defense stats
 */
export interface ParsedDefenseStats {
  teamName: string;
  abbreviation: string;
  stats: {
    sacks: number;
    interceptions: number;
    fumblesRecovered: number;
    defensiveTd: number;
    safeties: number;
    pointsAllowed: number;
  };
  totalPoints: number;
}
