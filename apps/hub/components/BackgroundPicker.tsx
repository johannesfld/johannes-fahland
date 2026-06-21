"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BACKGROUND, normalizeHex, useBackground } from "@/components/BackgroundProvider";
import { cn } from "@/components/ui/styles";

type BackgroundPickerProps = {
  className?: string;
  /** "compact" = schlank (Sidebar-Footer); "full" = mit Titel & Text (Home). */
  variant?: "compact" | "full";
};

/** Dezente Startpunkte — frei verstellbar, kein fixes Preset-System. */
const SUGGESTIONS = [
  "#e44890", // Pink (Marke)
  "#7c3aed", // Violett
  "#2563eb", // Blau
  "#0d9488", // Petrol
  "#16a34a", // Grün
  "#d97706", // Safran
  "#dc2626", // Rot
  "#475569", // Graphit
];

export function BackgroundPicker({ className = "", variant = "compact" }: BackgroundPickerProps) {
  const { background, setBackground } = useBackground();
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState(background);

  useEffect(() => setHydrated(true), []);
  useEffect(() => setDraft(background), [background]);

  const current = hydrated ? background : DEFAULT_BACKGROUND;

  const commitDraft = (raw: string) => {
    const norm = normalizeHex(raw);
    if (norm) setBackground(norm);
    else setDraft(current);
  };

  if (variant === "full") {
    return (
      <section className={cn("flex flex-col gap-3", className)} aria-label="Hintergrundfarbe">
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
            Hintergrund
          </p>
          <p className="text-sm text-[var(--vibe-fg-muted)]">
            Wähle jede Farbe, die du magst — dein Spieltisch passt sich an.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label
            className="relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-[var(--vibe-r-lg)] shadow-[var(--vibe-edge),var(--vibe-shadow-soft)] ring-1 ring-[var(--vibe-line-strong)]"
            style={{ background: current }}
            aria-label="Farbe wählen"
          >
            <input
              type="color"
              value={current}
              onChange={(e) => setBackground(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
              Hex-Code
            </span>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commitDraft(draft)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitDraft(draft);
                }
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="w-full max-w-[10rem] rounded-[var(--vibe-r-md)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-3 py-2 font-mono text-sm text-[var(--vibe-fg-base)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/25"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((hex) => {
            const active = hydrated && background.toLowerCase() === hex;
            return (
              <button
                key={hex}
                type="button"
                onClick={() => setBackground(hex)}
                aria-pressed={active}
                aria-label={`Vorschlag ${hex}`}
                className={cn(
                  "h-8 w-8 rounded-full transition-transform hover:scale-110",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vibe-bg-elevated)]",
                  active
                    ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--vibe-bg-sunken)]"
                    : "ring-1 ring-[var(--vibe-line-strong)]",
                )}
                style={{ background: hex }}
              />
            );
          })}
        </div>
      </section>
    );
  }

  // compact — Swatch + Hex für die Sidebar
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
        Hintergrund
      </p>
      <div className="flex items-center gap-2">
        <label
          className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-[var(--vibe-edge)] ring-1 ring-[var(--vibe-line-strong)]"
          style={{ background: current }}
          aria-label="Farbe wählen"
        >
          <input
            type="color"
            value={current}
            onChange={(e) => setBackground(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commitDraft(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft(draft);
            }
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="w-full min-w-0 rounded-[var(--vibe-r-md)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-2 py-1.5 font-mono text-xs text-[var(--vibe-fg-base)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>
    </div>
  );
}
