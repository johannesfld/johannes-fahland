export const SETTINGS_STORAGE_KEY = "schiffe-versenken-colors-v1";

export type SchiffeColorSettings = {
  hit: string;
  miss: string;
};

export const DEFAULT_COLORS: SchiffeColorSettings = {
  hit: "#dc2626",
  miss: "#e4e4e7",
};

/** Accepts #rgb or #rrggbb (with or without #); returns lowercase #rrggbb or null. */
export function normalizeHexInput(raw: string): string | null {
  let t = raw.trim();
  if (t.startsWith("#")) t = t.slice(1);
  if (t.length === 3 && /^[0-9a-fA-F]{3}$/.test(t)) {
    t = `${t[0]}${t[0]}${t[1]}${t[1]}${t[2]}${t[2]}`;
  }
  if (t.length === 6 && /^[0-9a-fA-F]{6}$/.test(t)) return `#${t.toLowerCase()}`;
  return null;
}

export function loadColorSettings(): SchiffeColorSettings {
  if (typeof window === "undefined") return DEFAULT_COLORS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_COLORS;
    const p = JSON.parse(raw) as Partial<SchiffeColorSettings>;
    if (typeof p.hit !== "string" || typeof p.miss !== "string")
      return DEFAULT_COLORS;
    const hit = normalizeHexInput(p.hit);
    const miss = normalizeHexInput(p.miss);
    if (hit && miss) return { hit, miss };
  } catch {
    /* ignore */
  }
  return DEFAULT_COLORS;
}

export function saveColorSettings(s: SchiffeColorSettings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
