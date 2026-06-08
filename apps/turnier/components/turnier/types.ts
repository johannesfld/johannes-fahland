export type TournamentStatus = "setup" | "active" | "paused" | "finished";
export type RoundStatus = "drawn" | "playing" | "completed";
export type MatchStatus = "pending" | "playing" | "completed";
export type BestOf = 1 | 3 | 5;
export type TournamentFormat = "singles" | "doubles";

export type TournamentPlayer = {
  id: string;
  name: string;
  active: boolean;
  joinedAtRound: number;
  leftAtRound: number | null;
  roundsPlayed: number;
  roundsSatOut: number;
};

export type MatchSet = {
  setNumber: number;
  scoreTeam1: number;
  scoreTeam2: number;
};

export type MatchPlayer = {
  playerId: string;
  name: string;
  team: 1 | 2;
};

export type MatchEntry = {
  id: string;
  matchNumber: number;
  status: MatchStatus;
  winnerTeam: 1 | 2 | null;
  players: MatchPlayer[];
  sets: MatchSet[];
};

export type RoundEntry = {
  id: string;
  roundNumber: number;
  status: RoundStatus;
  matches: MatchEntry[];
};

export type TournamentDetail = {
  id: string;
  name: string;
  status: TournamentStatus;
  format: TournamentFormat;
  bestOf: BestOf;
  winnerName: string | null;
  createdAt: string;
  updatedAt: string;
  players: TournamentPlayer[];
  rounds: RoundEntry[];
};

export type TournamentListItem = {
  id: string;
  name: string;
  status: TournamentStatus;
  format: TournamentFormat;
  bestOf: BestOf;
  winnerName: string | null;
  createdAt: string;
  updatedAt: string;
  playerCount: number;
};

export type StandingRow = {
  playerId: string;
  name: string;
  active: boolean;
  rank: number;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
  pointsWon: number;
  pointsLost: number;
  pointDiff: number;
};

export type ApiEnvelope<T> = {
  data: T;
  updatedAt: string;
};
