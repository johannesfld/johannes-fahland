"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { BACKGROUNDS, useBackground } from "@/components/BackgroundProvider";
import { cn } from "@/components/ui/styles";

type BackgroundPickerProps = {
  className?: string;
  /** "compact" = nur Swatches (Sidebar-Footer); "full" = mit Titel & Labels (Home). */
  variant?: "compact" | "full";
};

export function BackgroundPicker({ className = "", variant = "compact" }: BackgroundPickerProps) {
  const { background, setBackground } = useBackground();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (variant === "full") {
    return (
      <section className={cn("flex flex-col gap-3", className)} aria-label="Hintergrundfarbe">
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
            Hintergrund
          </p>
          <p className="text-sm text-[var(--vibe-fg-muted)]">
            Färbe deinen Spieltisch, wie du magst.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {BACKGROUNDS.map((bg) => {
            const active = hydrated && background === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => setBackground(bg.id)}
                aria-pressed={active}
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-[var(--vibe-r-lg)] border p-2 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                  active
                    ? "border-[var(--accent)] bg-[var(--vibe-bg-sunken)]"
                    : "border-[var(--vibe-line)] hover:border-[var(--vibe-line-strong)] hover:bg-[var(--vibe-bg-sunken)]/50",
                )}
              >
                <span
                  className="relative flex h-10 w-full items-center justify-center rounded-[var(--vibe-r-md)] shadow-[var(--vibe-edge),var(--vibe-shadow-flat)]"
                  style={{ background: bg.swatch }}
                >
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]"
                    >
                      <Check size={13} strokeWidth={3} />
                    </motion.span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    active ? "text-[var(--vibe-fg-base)]" : "text-[var(--vibe-fg-muted)]",
                  )}
                >
                  {bg.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  // compact — Swatch-Reihe für die Sidebar
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
        Hintergrund
      </p>
      <div className="flex flex-wrap gap-1.5">
        {BACKGROUNDS.map((bg) => {
          const active = hydrated && background === bg.id;
          return (
            <button
              key={bg.id}
              type="button"
              onClick={() => setBackground(bg.id)}
              aria-pressed={active}
              title={bg.label}
              aria-label={`Hintergrund ${bg.label}`}
              className={cn(
                "relative h-6 w-6 shrink-0 rounded-full transition-transform",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--vibe-bg-elevated)]",
                "hover:scale-110",
                active
                  ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--vibe-bg-sunken)]"
                  : "ring-1 ring-[var(--vibe-line-strong)]",
              )}
              style={{ background: bg.swatch }}
            >
              {active && (
                <span className="absolute inset-0 flex items-center justify-center text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
