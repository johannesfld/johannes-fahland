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

/** WCAG relative luminance -> returns "#ffffff" or "#18181b" for readable contrast. */
export function textColorForBg(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.179 ? "#18181b" : "#ffffff";
}

export function saveColorSettings(s: SchiffeColorSettings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
