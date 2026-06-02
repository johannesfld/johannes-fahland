export type CardState = "hidden" | "flipped" | "matched";

export type Card = {
  id: number;
  symbol: string;
  state: CardState;
};

export type GameMode = "1p" | "2p";

export type GameStatus = "idle" | "running" | "won";

export type GameState = {
  cards: Card[];
  flipped: number[];
  moves: number;
  matched: number;
  status: GameStatus;
  mode: GameMode;
  scores: [number, number];
  currentPlayer: 0 | 1;
  gridSize: 4 | 6;
  lockBoard: boolean;
};
