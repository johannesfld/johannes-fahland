"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Frei wählbarer Tisch-Hintergrund. Statt fester Presets wählt der Nutzer eine
 * beliebige Farbe (Hex). Daraus leiten wir das komplette Surface-Set ab —
 * für Nacht (dunkel, sattes Filz-Pendant) und Tag (helles Papier-Pendant) —
 * und schreiben es als Inline-Variablen direkt auf <html>. Vordergrund, Akzent
 * und Tool-Farben bleiben unangetastet (Lesbarkeit + Marke).
 *
 * Gespeichert wird nur der gewählte Hex-Wert (`pasch-bg`). Das Init-Script in
 * layout.tsx wendet ihn bereits vor dem ersten Paint an (FOUC-Schutz).
 */

export const BACKGROUND_STORAGE_KEY = "pasch-bg";

/** Markenfarbe Logo-Pink als Default-Tischfarbe. */
export const DEFAULT_BACKGROUND = "#E44890";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function normalizeHex(input: string): string | null {
  const v = input.trim();
  if (!HEX_RE.test(v)) return null;
  return (v.startsWith("#") ? v : `#${v}`).toLowerCase();
}

/* ── Farb-Mathe: Hex ⇄ HSL ──────────────────────────────────────────── */

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Surface-Set aus der gewählten Farbe ableiten. Wir nehmen nur Hue + (gedämpfte)
 * Sättigung der Wahl und setzen die Helligkeiten fest — so bleibt JEDE Wahl als
 * Tischfarbe erkennbar, aber dunkel/hell genug für lesbaren Vorder­grund.
 */
function surfacesFor(hex: string, dark: boolean) {
  const { h, s } = hexToHsl(hex);
  // Sättigung kräftig, aber gedeckelt — lebendig statt blass, ohne grell zu werden.
  const sat = dark ? Math.min(60, Math.max(28, s)) : Math.min(48, Math.max(22, s));
  // Helligkeits-Stufen (L in %). Dark: tief & sattes Nacht-Filz. Light: helles Papier.
  const L = dark
    ? { base: 13, elevated: 18, sunken: 9, tinted: 22, overlay: 24 }
    : { base: 93, elevated: 97, sunken: 88, tinted: 90, overlay: 99 };
  return {
    "--vibe-bg-base": hslToHex(h, sat, L.base),
    "--vibe-bg-elevated": hslToHex(h, sat, L.elevated),
    "--vibe-bg-sunken": hslToHex(h, sat, L.sunken),
    "--vibe-bg-tinted": hslToHex(h, sat, L.tinted),
    "--vibe-bg-overlay": hslToHex(h, sat, L.overlay),
    "--background": hslToHex(h, sat, L.base),
    "--surface": hslToHex(h, sat, L.elevated),
    "--surface-muted": hslToHex(h, sat, L.sunken),
  } as Record<string, string>;
}

const SURFACE_KEYS = [
  "--vibe-bg-base",
  "--vibe-bg-elevated",
  "--vibe-bg-sunken",
  "--vibe-bg-tinted",
  "--vibe-bg-overlay",
  "--background",
  "--surface",
  "--surface-muted",
];

function syncThemeColor() {
  const bgBase = getComputedStyle(document.documentElement)
    .getPropertyValue("--vibe-bg-base")
    .trim();
  if (!bgBase) return;
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]:not([media])',
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", bgBase);
}

function applyDom(hex: string) {
  const root = document.documentElement;
  const dark = root.classList.contains("dark");
  // Alte Preset-Logik (data-bg) ist obsolet — entfernen, falls noch gesetzt.
  root.removeAttribute("data-bg");
  const vars = surfacesFor(hex, dark);
  for (const k of SURFACE_KEYS) root.style.setProperty(k, vars[k]);
  syncThemeColor();
}

type Ctx = {
  /** aktuell gewählter Hex-Wert */
  background: string;
  setBackground: (hex: string) => void;
};

const BackgroundContext = createContext<Ctx | null>(null);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [background, setBgState] = useState<string>(DEFAULT_BACKGROUND);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY);
      const init = (stored && normalizeHex(stored)) || DEFAULT_BACKGROUND;
      setBgState(init);
      applyDom(init);
      setMounted(true);
    });
  }, []);

  // Beim Theme-Wechsel (light/dark) Surfaces neu aus der gewählten Farbe ableiten.
  useEffect(() => {
    const obs = new MutationObserver(() => {
      applyDom(background);
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [background]);

  const setBackground = useCallback((hex: string) => {
    const norm = normalizeHex(hex) ?? DEFAULT_BACKGROUND;
    setBgState(norm);
    applyDom(norm);
    try {
      localStorage.setItem(BACKGROUND_STORAGE_KEY, norm);
    } catch {
      /* localStorage kann in privaten Modi werfen — Auswahl bleibt zur Laufzeit gültig. */
    }
  }, []);

  const value = useMemo(
    () => ({ background: mounted ? background : DEFAULT_BACKGROUND, setBackground }),
    [background, mounted, setBackground],
  );

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const ctx = useContext(BackgroundContext);
  if (!ctx) {
    throw new Error("useBackground must be used within BackgroundProvider");
  }
  return ctx;
}
