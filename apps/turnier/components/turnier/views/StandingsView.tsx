"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, RotateCcw, Smartphone, X } from "lucide-react";
import { StandingsTable } from "@/components/turnier/components/StandingsTable";
import { subtleBtn, turnierCard } from "@/components/turnier/styles";
import { cn } from "@/components/ui/styles";
import { WIN_POINTS, resolveScoring, usesMatchPoints } from "@/lib/turnier/scoring";
import type { StandingRow, TournamentDetail } from "@/components/turnier/types";

type StandingsViewProps = {
  rows: StandingRow[];
  tournament: TournamentDetail;
  viewedRoundNumber: number | null;
  isViewingLatestRound: boolean;
  hasRounds: boolean;
  onJumpToLatest: () => void;
};

/** Viewport-Orientierung als externer Store – kein setState im Effect nötig. */
const orientationStore = {
  subscribe(onChange: () => void) {
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  },
  getSnapshot: () => window.innerHeight > window.innerWidth,
  getServerSnapshot: () => false,
};

/**
 * Vollbild-Tabelle im erzwungenen Querformat.
 *
 * screen.orientation.lock() allein genügt nicht: Genau dann, wenn der Nutzer die
 * System-Rotationssperre aktiviert hat – und auf iOS generell – schlägt es fehl.
 * Deshalb wird der Inhalt bei hochkantem Viewport per CSS um 90 Grad gedreht und
 * auf getauschte Kantenlängen gelegt. Dreht das Gerät anschließend (oder der
 * Lock greift doch), wird der Viewport quer, `portrait` kippt auf false und die
 * CSS-Drehung entfällt – beide Wege enden im selben Bild.
 */
function useTableFullscreen() {
  const [active, setActive] = useState(false);
  const [hintArmed, setHintArmed] = useState(false);
  const portrait = useSyncExternalStore(
    orientationStore.subscribe,
    orientationStore.getSnapshot,
    orientationStore.getServerSnapshot,
  );

  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement) setActive(false);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Hinweis nur kurz zeigen; setState läuft im Timer-Callback, nicht im Effektrumpf.
  useEffect(() => {
    if (!hintArmed) return;
    const timer = window.setTimeout(() => setHintArmed(false), 1900);
    return () => window.clearTimeout(timer);
  }, [hintArmed]);

  // Sobald das Gerät quer steht, ist der Hinweis erledigt – abgeleitet statt
  // per Effekt gesetzt.
  const showRotateHint = hintArmed && portrait;

  const enter = useCallback(async () => {
    const isPortraitNow = window.innerHeight > window.innerWidth;
    setActive(true);
    if (isPortraitNow) setHintArmed(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* iOS-Safari am iPhone kennt das nicht – das Overlay genügt dort */
    }
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      await orientation.lock?.("landscape");
    } catch {
      /* bei aktiver Rotationssperre und auf iOS erwartbar – CSS-Drehung greift */
    }
  }, []);

  const exit = useCallback(async () => {
    setActive(false);
    setHintArmed(false);
    try {
      screen.orientation.unlock?.();
    } catch {
      /* nicht überall verfügbar */
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* nicht überall verfügbar */
    }
  }, []);

  return { active, portrait, showRotateHint, enter, exit };
}

export function StandingsView({
  rows,
  tournament,
  viewedRoundNumber,
  isViewingLatestRound,
  hasRounds,
  onJumpToLatest,
}: StandingsViewProps) {
  const throughRound = hasRounds && viewedRoundNumber != null ? viewedRoundNumber : null;
  const showHistoricalBanner = hasRounds && !isViewingLatestRound;
  const fs = useTableFullscreen();

  // Im reinen K.-o.-System gibt es keine Unentschieden – dort bleibt der alte
  // Hinweis stehen, sonst erklärt er die gewählte Wertung.
  const scoring = resolveScoring(tournament.config);
  const sortHint =
    tournament.mode === "knockout"
      ? "Sortiert nach Siegen, dann Satz- und Balldifferenz."
      : usesMatchPoints(scoring)
        ? `Sortiert nach Punkten (Sieg ${WIN_POINTS[scoring]}, Unentschieden 1, Niederlage 0), dann Quote sowie Satz- und Balldifferenz.`
        : "Sortiert nach Siegen, dann Unentschieden, Quote sowie Satz- und Balldifferenz.";

  const table = (
    <StandingsTable
      rows={rows}
      tournament={tournament}
      throughRoundInclusive={throughRound}
      // Im Vollbild immer alle Spalten: bei gedrehter Darstellung greifen die
      // Breakpoints sonst auf die schmale Hochkant-Breite.
      wide={fs.active}
    />
  );

  // Hochkant: Rahmen mit getauschten Kanten, um die linke obere Ecke gedreht.
  const frameStyle: React.CSSProperties = fs.portrait
    ? {
        position: "fixed",
        top: 0,
        left: "100dvw",
        width: "100dvh",
        height: "100dvw",
        transformOrigin: "top left",
        transform: "rotate(90deg)",
      }
    : { position: "fixed", inset: 0 };

  return (
    <section className={`${turnierCard} flex min-w-0 flex-col gap-4`}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl">
          Tabelle
        </h2>
        <button
          type="button"
          onClick={fs.enter}
          aria-label="Tabelle im Vollbild anzeigen"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-soft)] transition-transform duration-200 [transition-timing-function:var(--vibe-ease-spring)] active:scale-[0.92] [@media(hover:hover)]:hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
        >
          <Maximize2 className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>

      {showHistoricalBanner ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--vibe-fg-base)] sm:text-sm">
          <p className="min-w-0 flex-1 font-semibold">Stand bis Runde {throughRound}</p>
          <button type="button" className={cn(subtleBtn, "shrink-0")} onClick={onJumpToLatest}>
            Zur aktuellen Runde
          </button>
        </div>
      ) : null}

      {/* Im Vollbild lebt die Tabelle im Portal – sonst stünde sie doppelt im
          DOM, inklusive doppelter Bedienelemente für Screenreader. */}
      <div className="min-w-0">{fs.active ? null : table}</div>

      {/* Hinweise bewusst unter der Tabelle, nicht davor. */}
      <div className="flex min-w-0 flex-col gap-1 text-xs text-[var(--vibe-fg-faint)]">
        <p className="inline-flex items-center gap-1.5 font-medium text-[var(--vibe-fg-muted)] sm:hidden landscape:hidden">
          <RotateCcw className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
          Quer drehen zeigt Spiele, Sätze und Bälle.
        </p>
        <p>{sortHint} Spieler antippen für Details.</p>
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {fs.active ? (
                <motion.div
                  key="table-fullscreen"
                  className="fixed inset-0 z-[90] bg-[var(--vibe-bg-base)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={frameStyle} className="overflow-auto p-3 pt-14">
                    <button
                      type="button"
                      onClick={fs.exit}
                      aria-label="Vollbild beenden"
                      className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-lifted)] transition-transform duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
                    >
                      <X className="h-5 w-5" strokeWidth={2.4} />
                    </button>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                      {table}
                    </motion.div>
                  </div>

                  {/* Dreh-Hinweis bewusst ungedreht – er soll in der aktuellen
                      Handhaltung lesbar sein. */}
                  <AnimatePresence>
                    {fs.showRotateHint ? (
                      <motion.div
                        key="rotate-hint"
                        className="pointer-events-none fixed inset-0 z-[95] flex flex-col items-center justify-center gap-4 bg-[var(--vibe-bg-base)]/85 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 0, 90, 90] }}
                          transition={{
                            duration: 1.6,
                            times: [0, 0.25, 0.7, 1],
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="flex h-20 w-20 items-center justify-center rounded-[var(--vibe-r-2xl)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--vibe-shadow-clay)]"
                        >
                          <Smartphone className="h-10 w-10" strokeWidth={2} aria-hidden />
                        </motion.div>
                        <p className="font-display text-lg font-extrabold tracking-tight text-[var(--vibe-fg-base)]">
                          Gerät drehen
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </section>
  );
}
