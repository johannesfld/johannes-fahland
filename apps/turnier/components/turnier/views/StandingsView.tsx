"use client";

import { useCallback, useEffect, useState } from "react";
import { Maximize2, RotateCcw, X } from "lucide-react";
import { StandingsTable } from "@/components/turnier/components/StandingsTable";
import { subtleBtn, turnierCard } from "@/components/turnier/styles";
import { cn } from "@/components/ui/styles";
import type { StandingRow, TournamentDetail } from "@/components/turnier/types";

type StandingsViewProps = {
  rows: StandingRow[];
  tournament: TournamentDetail;
  viewedRoundNumber: number | null;
  isViewingLatestRound: boolean;
  hasRounds: boolean;
  onJumpToLatest: () => void;
};

/**
 * Vollbild für die Tabelle. Nutzt die Fullscreen-API, wo verfügbar (blendet die
 * Browser-Leisten aus) und versucht zusätzlich, ins Querformat zu drehen – das
 * bringt die zusätzlichen Statspalten ins Bild. iOS-Safari auf dem iPhone kennt
 * beides für normale Elemente nicht, deshalb liegt darunter immer noch ein
 * fixiertes Overlay, das dort denselben Effekt erzielt.
 */
function useTableFullscreen() {
  const [active, setActive] = useState(false);

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

  const enter = useCallback(async () => {
    setActive(true);
    try {
      // Ganzes Dokument statt eines Elements: das Overlay zeichnet die Tabelle
      // ohnehin darüber, und so wird kein Ref im Render gebraucht.
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* nicht unterstützt – Overlay allein genügt */
    }
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      await orientation.lock?.("landscape");
    } catch {
      /* Desktop/iOS erlauben kein Locken */
    }
  }, []);

  const exit = useCallback(async () => {
    setActive(false);
    try {
      screen.orientation.unlock?.();
    } catch {
      /* egal */
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* egal */
    }
  }, []);

  return { active, enter, exit };
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

      <div
        className={cn(
          "min-w-0",
          fs.active &&
            // Extra Kopfraum, damit der Schließen-Button nicht auf der
            // Tabellenkopfzeile sitzt.
            "fixed inset-0 z-[80] flex flex-col gap-2 overflow-auto bg-[var(--vibe-bg-base)] p-3 pt-[calc(env(safe-area-inset-top)+3.75rem)]",
        )}
      >
        {fs.active ? (
          <button
            type="button"
            onClick={fs.exit}
            aria-label="Vollbild beenden"
            className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-lifted)] transition-transform duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
          >
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        ) : null}
        <StandingsTable rows={rows} tournament={tournament} throughRoundInclusive={throughRound} />
      </div>

      {/* Hinweise bewusst unter der Tabelle, nicht davor. */}
      <div className="flex min-w-0 flex-col gap-1 text-xs text-[var(--vibe-fg-faint)]">
        {!fs.active ? (
          <p className="inline-flex items-center gap-1.5 font-medium text-[var(--vibe-fg-muted)] sm:hidden landscape:hidden">
            <RotateCcw className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
            Quer drehen zeigt Spiele, Sätze und Punkte.
          </p>
        ) : null}
        <p>Sortiert nach Siegen, dann Satz- und Balldifferenz. Spieler antippen für Details.</p>
      </div>
    </section>
  );
}
