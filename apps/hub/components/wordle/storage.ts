import { migrateKey } from "@/lib/migrate-storage";
import type { GameState } from "./types";

const STATE_KEY = "pasch-wordle-state-v1";

migrateKey("vibecode-wordle-state-v1", STATE_KEY);

type StoredState = {
  date: string;
  guesses: GameState["guesses"];
  currentRow: number;
  currentInput: string;
  status: GameState["status"];
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadTodayState(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (parsed.date !== todayKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTodayState(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const stored: StoredState = {
      date: todayKey(),
      guesses: state.guesses,
      currentRow: state.currentRow,
      currentInput: state.currentInput,
      status: state.status,
    };
    window.localStorage.setItem(STATE_KEY, JSON.stringify(stored));
  } catch {
    /* ignore */
  }
}
