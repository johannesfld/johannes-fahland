import type { GameState, GuessLetter, LetterState } from "./types";
import { MAX_GUESSES, WORD_LENGTH } from "./types";

export function getDailyWord(words: string[]): string {
  const seed = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return words[hash % words.length];
}

export function createInitialState(answer: string): GameState {
  return {
    answer,
    guesses: Array.from({ length: MAX_GUESSES }, () =>
      Array.from({ length: WORD_LENGTH }, () => ({ char: "", state: "empty" as const }))
    ),
    currentRow: 0,
    currentInput: "",
    status: "playing",
    shake: false,
    message: "",
  };
}

export function evaluateGuess(guess: string, answer: string): GuessLetter[] {
  const result: GuessLetter[] = Array.from({ length: WORD_LENGTH }, (_, i) => ({
    char: guess[i],
    state: "absent" as LetterState,
  }));

  const answerChars = answer.split("");
  const used = new Array(WORD_LENGTH).fill(false);

  // Pass 1: correct positions
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i].state = "correct";
      used[i] = true;
    }
  }

  // Pass 2: present but wrong position
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i].state === "correct") continue;
    const j = answerChars.findIndex((c, idx) => !used[idx] && c === guess[i]);
    if (j !== -1) {
      result[i].state = "present";
      used[j] = true;
    }
  }

  return result;
}

export function getKeyboardState(guesses: GuessLetter[][]): Record<string, LetterState> {
  const map: Record<string, LetterState> = {};
  const priority: Record<LetterState, number> = { correct: 3, present: 2, absent: 1, empty: 0, active: 0 };

  for (const row of guesses) {
    for (const cell of row) {
      if (!cell.char || cell.state === "empty" || cell.state === "active") continue;
      const current = map[cell.char];
      if (!current || priority[cell.state] > priority[current]) {
        map[cell.char] = cell.state;
      }
    }
  }
  return map;
}

export function addLetter(state: GameState, letter: string): GameState {
  if (state.status !== "playing") return state;
  if (state.currentInput.length >= WORD_LENGTH) return state;
  return { ...state, currentInput: state.currentInput + letter, message: "", shake: false };
}

export function deleteLetter(state: GameState): GameState {
  if (state.status !== "playing") return state;
  return { ...state, currentInput: state.currentInput.slice(0, -1), message: "", shake: false };
}

export function submitGuess(state: GameState, words: string[]): GameState {
  if (state.status !== "playing") return state;
  if (state.currentInput.length < WORD_LENGTH) {
    return { ...state, shake: true, message: "Zu kurz!" };
  }

  const guess = state.currentInput.toUpperCase();

  if (!words.includes(guess)) {
    return { ...state, shake: true, message: "Unbekanntes Wort" };
  }

  const evaluated = evaluateGuess(guess, state.answer);
  const newGuesses = state.guesses.map((row, i) =>
    i === state.currentRow ? evaluated : row
  );
  const won = evaluated.every((l) => l.state === "correct");
  const nextRow = state.currentRow + 1;
  const lost = !won && nextRow >= MAX_GUESSES;

  return {
    ...state,
    guesses: newGuesses,
    currentRow: nextRow,
    currentInput: "",
    status: won ? "won" : lost ? "lost" : "playing",
    shake: false,
    message: won ? "🎉 Richtig!" : lost ? `Lösung: ${state.answer}` : "",
  };
}

export function clearShake(state: GameState): GameState {
  return { ...state, shake: false };
}
