const BEST_KEY = "vibecode-snake-best-v1";

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

export function saveBest(score: number): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadBest();
    if (score > current) window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    /* ignore */
  }
}
