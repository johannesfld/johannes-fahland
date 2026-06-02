const BEST_KEY = "vibecode-memory-best-v1";

export type BestScore = { moves: number; gridSize: 4 | 6 };

export function loadBest(gridSize: 4 | 6): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${BEST_KEY}-${gridSize}`);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveBest(gridSize: 4 | 6, moves: number): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadBest(gridSize);
    if (current === null || moves < current) {
      window.localStorage.setItem(`${BEST_KEY}-${gridSize}`, String(moves));
    }
  } catch {
    /* ignore */
  }
}
