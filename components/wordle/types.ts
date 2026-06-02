export type LetterState = "correct" | "present" | "absent" | "empty" | "active";

export type GuessLetter = {
  char: string;
  state: LetterState;
};

export type GameStatus = "playing" | "won" | "lost";

export type GameState = {
  answer: string;
  guesses: GuessLetter[][];
  currentRow: number;
  currentInput: string;
  status: GameStatus;
  shake: boolean;
  message: string;
};

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
