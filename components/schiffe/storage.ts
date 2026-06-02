import type { GameState } from "@/components/schiffe/types";

const KEY = "schiffe-game-v1";

type SerializedGameState = Omit<GameState, "trackerManualMisses"> & {
  trackerManualMisses: string[];
};

export function loadSchiffeState(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SerializedGameState;
    if (!parsed.phase || !Array.isArray(parsed.myShips)) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return {
      ...parsed,
      trackerManualMisses: new Set(parsed.trackerManualMisses ?? []),
    };
  } catch {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function saveSchiffeState(state: GameState): void {
  if (typeof window === "undefined") return;
  const serialized: SerializedGameState = {
    ...state,
    trackerManualMisses: Array.from(state.trackerManualMisses),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(serialized));
  } catch {
    /* ignore */
  }
}

export function clearSchiffeState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
