export type Player = {
  name: string;
  isDummy: boolean;
  totalScore: number;
  history: RoundResult[];
};

export type RoundResult = {
  roundNumber: number;
  bid: number;
  actual: number;
  points: number;
};

export type MainStage = "setup" | "game" | "finished";
export type GamePhase =
  | "rules"
  | "mixer-announcement"
  | "bids"
  | "actuals"
  | "scoreboard";

export type GameState = {
  mainStage: MainStage;
  gamePhase: GamePhase;
  players: Player[];
  totalRounds: number;
  roundNumber: number;
  mixerIndex: number;
  currentBidderIndex: number;
  currentActualIndex: number;
  pendingBids: number[];
  pendingActuals: number[];
};
