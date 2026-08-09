"use client";

import { motion } from "framer-motion";
import { MatchCard } from "@/components/turnier/components/MatchCard";
import { actionBtn, subtleBtn, turnierCard } from "@/components/turnier/styles";
import type { RoundEntry, TournamentFormat, TournamentMode } from "@/components/turnier/types";

type DrawViewProps = {
  round: RoundEntry | null;
  format: TournamentFormat;
  mode: TournamentMode;
  /** Auslosung läuft serverseitig – Platzhalter statt fingiertem Ergebnis. */
  isDrawing: boolean;
  readOnly: boolean;
  isViewingLatestRound: boolean;
  hasRounds: boolean;
  coverageComplete: boolean;
  pairCovered: number;
  pairNeeded: number;
  estimatedRoundsTotal: number;
  onDrawRound: () => void;
  onJumpToLatest: () => void;
};

export function DrawView({
  round,
  format,
  mode,
  isDrawing,
  readOnly,
  isViewingLatestRound,
  hasRounds,
  coverageComplete,
  pairCovered,
  pairNeeded,
  estimatedRoundsTotal,
  onDrawRound,
  onJumpToLatest,
}: DrawViewProps) {
  const showHistoricalBanner = hasRounds && !isViewingLatestRound;
  // isDrawing sperrt nur die Auslosung selbst (verhindert Doppel-Auslosung),
  // nicht die übrige Bedienung.
  const drawDisabled =
    isDrawing || readOnly || !isViewingLatestRound || coverageComplete;

  const isRoundRobin = mode === "round_robin";
  const isDoubles = format === "doubles";
  const headingBase = round
    ? round.stageLabel ?? `Runde ${round.roundNumber}`
    : "Auslosung";
  // Während der Auslosung sofort auf die neue Rundennummer springen – der
  // Nutzer soll direkt sehen, dass seine Aktion angekommen ist.
  const heading = isDrawing
    ? `Auslosung – Runde ${(round?.roundNumber ?? 0) + 1}`
    : round && !isRoundRobin
      ? headingBase
      : round
        ? `Auslosung – Runde ${round.roundNumber}`
        : "Auslosung";
  const drawLabelNonRR = hasRounds ? "Nächste Runde auslosen" : "Auslosen & starten";
  const pairLabel = isDoubles ? "Partnerpaare" : "Gegnerpaare";

  return (
    <section className={`${turnierCard} flex min-w-0 flex-col gap-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-extrabold tracking-tight sm:truncate sm:text-2xl">
            {heading}
          </h2>
          {pairNeeded > 0 ? (
            <p className="mt-1 text-xs text-[var(--vibe-fg-muted)]">
              <span className="font-semibold text-[var(--vibe-fg-base)]">
                {pairLabel} {pairCovered}/{pairNeeded}
              </span>
              {coverageComplete ? (
                <span className="font-semibold text-[var(--ok-ink)]"> · komplett</span>
              ) : (
                <span className="text-[var(--vibe-fg-faint)]"> · ca. {estimatedRoundsTotal} Runden</span>
              )}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className={`${actionBtn} w-full shrink-0 sm:w-auto`}
          disabled={drawDisabled}
          onClick={onDrawRound}
        >
          {isRoundRobin
            ? hasRounds
              ? "Nächste Runde auslosen"
              : "Erste Runde auslosen"
            : drawLabelNonRR}
        </button>
      </div>

      {showHistoricalBanner ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--vibe-fg-base)] sm:px-4 sm:py-3 sm:text-sm">
          <p className="min-w-0 flex-1 font-semibold">Vergangene Runde</p>
          <button
            type="button"
            className={`${subtleBtn} shrink-0`}
            onClick={onJumpToLatest}
          >
            Zur aktuellen Runde
          </button>
        </div>
      ) : null}

      {isDrawing ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <p className="col-span-full text-sm font-semibold text-[var(--vibe-fg-muted)]">
            Lose werden gezogen…
          </p>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-4 shadow-[var(--vibe-shadow-soft)]"
            >
              <div className="h-3 w-16 animate-[turnier-pulse_1.6s_ease-in-out_infinite] rounded-full bg-[var(--vibe-bg-sunken)]" />
              <div className="h-10 w-full animate-[turnier-pulse_1.6s_ease-in-out_infinite] rounded-[var(--vibe-r-lg)] bg-[var(--vibe-bg-sunken)]" />
              <div className="h-10 w-full animate-[turnier-pulse_1.6s_ease-in-out_infinite] rounded-[var(--vibe-r-lg)] bg-[var(--vibe-bg-sunken)]" />
            </div>
          ))}
        </div>
      ) : round ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {round.matches.map((match, index) => (
            <motion.div
              key={match.id}
              className="min-w-0"
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.06, type: "spring", stiffness: 320, damping: 18, mass: 0.7 }}
            >
              <MatchCard match={match} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--vibe-line-strong)] bg-[var(--vibe-bg-sunken)]/50 p-4 text-center text-xs text-[var(--vibe-fg-muted)] sm:p-6 sm:text-sm">
          <p>Noch keine Runde ausgelost.</p>
        </div>
      )}
    </section>
  );
}
