import { migrateKey } from "@/lib/migrate-storage";

const BEST_KEY = "pasch-snake-best-v1";

migrateKey("vibecode-snake-best-v1", BEST_KEY);

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
