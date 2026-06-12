import { migrateKey } from "@/lib/migrate-storage";
import type { PlayerScores } from "@/components/kniffel/constants";

const KEY = "pasch-kniffel-score-v1";

migrateKey("kniffel-score-v1", KEY);

type SavedState = {
  playerNames: string[];
  scores: PlayerScores[];
  isStarted: boolean;
};

export function loadKniffelState(): SavedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedState;
    if (
      !Array.isArray(parsed.playerNames) ||
      !Array.isArray(parsed.scores) ||
      typeof parsed.isStarted !== "boolean"
    ) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function saveKniffelState(state: SavedState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearKniffelState(): void {
  localStorage.removeItem(KEY);
}
