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
 * Wählbarer Tisch-Hintergrund. Setzt `data-bg="x"` auf <html>; die zugehörigen
 * Surface-Variablen leben in `@pasch/ui/tokens.css` (`.dark[data-bg=x]` / `:root[data-bg=x]`).
 * Default ist "rosa" (Markenfarbe) — ohne gespeicherten Wert wird er via Init-Script
 * bereits vor dem ersten Paint gesetzt (FOUC-Schutz, siehe layout.tsx).
 */

export type BackgroundId =
  | "rosa"
  | "filz"
  | "mitternacht"
  | "aubergine"
  | "petrol"
  | "burgund"
  | "espresso"
  | "rosenholz"
  | "anthrazit";

export const DEFAULT_BACKGROUND: BackgroundId = "rosa";

export const BACKGROUND_STORAGE_KEY = "pasch-bg";

/** Kuratierte Reihenfolge + Anzeigenamen + Swatch-Farbe (repräsentativer Dark-Ton). */
export const BACKGROUNDS: { id: BackgroundId; label: string; swatch: string }[] = [
  { id: "rosa",        label: "Rosa",        swatch: "#341527" },
  { id: "filz",        label: "Filz",        swatch: "#0B1F17" },
  { id: "mitternacht", label: "Mitternacht", swatch: "#142136" },
  { id: "petrol",      label: "Petrol",      swatch: "#112C30" },
  { id: "aubergine",   label: "Aubergine",   swatch: "#271836" },
  { id: "burgund",     label: "Burgund",     swatch: "#311A20" },
  { id: "rosenholz",   label: "Rosenholz",   swatch: "#33232D" },
  { id: "espresso",    label: "Espresso",    swatch: "#2E211A" },
  { id: "anthrazit",   label: "Anthrazit",   swatch: "#212429" },
];

const VALID_IDS = new Set<string>(BACKGROUNDS.map((b) => b.id));

type Ctx = {
  background: BackgroundId;
  setBackground: (b: BackgroundId) => void;
};

const BackgroundContext = createContext<Ctx | null>(null);

function syncThemeColor() {
  // PWA-Statusbar/Browser-Chrome an den aktuellen Tisch-Hintergrund angleichen.
  const bgBase = getComputedStyle(document.documentElement)
    .getPropertyValue("--vibe-bg-base")
    .trim();
  if (!bgBase) return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", bgBase);
}

function applyDom(bg: BackgroundId) {
  // "filz" ist der Basiszustand der Tokens → kein data-bg nötig.
  if (bg === "filz") document.documentElement.removeAttribute("data-bg");
  else document.documentElement.setAttribute("data-bg", bg);
  syncThemeColor();
}

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [background, setBgState] = useState<BackgroundId>(DEFAULT_BACKGROUND);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY);
      const init: BackgroundId =
        stored && VALID_IDS.has(stored) ? (stored as BackgroundId) : DEFAULT_BACKGROUND;
      setBgState(init);
      applyDom(init);
      setMounted(true);
    });
  }, []);

  // theme-color nachziehen, wenn das Theme (light/dark) wechselt — dann ändert
  // sich --vibe-bg-base, ohne dass data-bg sich ändert.
  useEffect(() => {
    const obs = new MutationObserver(() => syncThemeColor());
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  const setBackground = useCallback((bg: BackgroundId) => {
    setBgState(bg);
    applyDom(bg);
    try {
      localStorage.setItem(BACKGROUND_STORAGE_KEY, bg);
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
