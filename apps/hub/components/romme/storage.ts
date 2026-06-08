const KEY = "romme-score-v1";

type RommeRound = {
  winnerIndex: number | null;
  scores: (number | null)[];
};

type SavedState = {
  playerNames: string[];
  rounds: RommeRound[];
  isStarted: boolean;
};

export function loadRommeState(): SavedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedState;
    if (
      !Array.isArray(parsed.playerNames) ||
      !Array.isArray(parsed.rounds) ||
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

export function saveRommeState(state: SavedState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearRommeState(): void {
  localStorage.removeItem(KEY);
}
