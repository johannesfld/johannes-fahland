import type { GameState } from "@/components/schiffe/types";

const KEY = "schiffe-game-v1";

type SerializedGameState = Omit<GameState, "trackerManualMisses"> & {
  trackerManualMisses: string[];
};

export function loadSchiffeState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SerializedGameState;
    if (!parsed.phase || !Array.isArray(parsed.myShips)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return {
      ...parsed,
      trackerManualMisses: new Set(parsed.trackerManualMisses ?? []),
    };
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function saveSchiffeState(state: GameState): void {
  const serialized: SerializedGameState = {
    ...state,
    trackerManualMisses: Array.from(state.trackerManualMisses),
  };
  localStorage.setItem(KEY, JSON.stringify(serialized));
}

export function clearSchiffeState(): void {
  localStorage.removeItem(KEY);
}
