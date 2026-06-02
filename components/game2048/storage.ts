import type { GameState } from "./types";

const STATE_KEY = "vibecode-2048-state-v1";
const BEST_KEY = "vibecode-2048-best-v1";

export function loadBest(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function saveBest(best: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BEST_KEY, String(best));
  } catch {
    /* ignore */
  }
}

export function loadState(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!Array.isArray(parsed.tiles)) {
      window.localStorage.removeItem(STATE_KEY);
      return null;
    }
    // strip transient flags
    return {
      ...parsed,
      tiles: parsed.tiles.map((t) => ({ ...t, isNew: false, mergedFrom: false })),
    };
  } catch {
    try {
      window.localStorage.removeItem(STATE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function saveState(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STATE_KEY);
  } catch {
    /* ignore */
  }
}
