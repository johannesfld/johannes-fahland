"use client";

import { motion } from "framer-motion";
import { MatchCard } from "@/components/turnier/components/MatchCard";
import { actionBtn, subtleBtn, turnierCard } from "@/components/turnier/styles";
import type { RoundEntry, TournamentFormat } from "@/components/turnier/types";

type DrawViewProps = {
  round: RoundEntry | null;
  format: TournamentFormat;
  isPending: boolean;
  readOnly: boolean;
  isViewingLatestRound: boolean;
  hasRounds: boolean;
  coverageComplete: boolean;
  pairCovered: number;
  pairNeeded: number;
  estimatedRoundsTotal: number;
  currentRoundNumber: number | null;
  onDrawRound: () => void;
  onJumpToLatest: () => void;
};

export function DrawView({
  round,
  format,
  isPending,
  readOnly,
  isViewingLatestRound,
  hasRounds,
  coverageComplete,
  pairCovered,
  pairNeeded,
  estimatedRoundsTotal,
  currentRoundNumber,
  onDrawRound,
  onJumpToLatest,
}: DrawViewProps) {
  const showHistoricalBanner = hasRounds && !isViewingLatestRound;
  const drawDisabled =
    isPending || readOnly || !isViewingLatestRound || coverageComplete;

  const isDoubles = format === "doubles";
  const pairLabel = isDoubles ? "Partnerpaare" : "Gegnerpaare";
  const introDesktop = isDoubles
    ? "Zufällige Teams und zufällige Gegnerpaare. Beim Auslosen wird automatisch zur neuen Runde gesprungen."
    : "Zufällige Einzelpaarungen. Beim Auslosen wird automatisch zur neuen Runde gesprungen.";
  const introMobile = isDoubles
    ? "Zufällige Teams und Gegner. Nach Auslosung springt die Ansicht zur neuen Runde."
    : "Zufällige Paarungen. Nach Auslosung springt die Ansicht zur neuen Runde.";
  const estimateDesktop = isDoubles
    ? `Geschätzt ca. ${estimatedRoundsTotal} Runden bis alle Partnerpaare einmal zusammen waren (Idealwert, je nach Auslosung variabel).`
    : `Geschätzt ca. ${estimatedRoundsTotal} Runden bis alle Spieler einmal gegeneinander gespielt haben (Idealwert, je nach Auslosung variabel).`;
  const estimateMobile = isDoubles
    ? `Ca. ${estimatedRoundsTotal} Runden bis alle Paare einmal zusammen waren (Schätzung).`
    : `Ca. ${estimatedRoundsTotal} Runden bis alle Gegnerpaare (Schätzung).`;
  const completeDesktop = isDoubles
    ? "Alle Partnerpaare erreicht – keine weitere Auslosung vorgesehen. Turnier kann beendet werden."
    : "Alle Gegnerpaare erreicht – keine weitere Auslosung vorgesehen. Turnier kann beendet werden.";
  const completeMobile = isDoubles
    ? "Alle Partnerpaare erreicht – Turnier kann beendet werden."
    : "Alle Gegnerpaare erreicht – Turnier kann beendet werden.";

  return (
    <section className={`${turnierCard} flex min-w-0 flex-col gap-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="font-display text-xl font-medium tracking-tight sm:truncate sm:text-2xl">
            {round ? `Auslosung – Runde ${round.roundNumber}` : "Auslosung"}
          </h2>
          <p className="hidden text-xs text-[var(--vibe-fg-muted)] sm:block sm:text-sm">
            {introDesktop}
          </p>
          <p className="text-xs text-[var(--vibe-fg-muted)] sm:hidden">{introMobile}</p>
          {pairNeeded > 0 ? (
            <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-3 py-2 text-xs text-[var(--vibe-fg-muted)]">
              <p className="font-semibold text-[var(--vibe-fg-base)]">
                {pairLabel} {pairCovered} / {pairNeeded}
                {currentRoundNumber != null ? ` · bisher Runde ${currentRoundNumber}` : ""}
              </p>
              <p className="hidden text-[var(--vibe-fg-faint)] sm:block">{estimateDesktop}</p>
              <p className="text-[var(--vibe-fg-faint)] sm:hidden">{estimateMobile}</p>
              {coverageComplete ? (
                <p className="font-semibold text-[var(--ok)]">
                  <span className="hidden sm:inline">{completeDesktop}</span>
                  <span className="sm:hidden">{completeMobile}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className={`${actionBtn} w-full shrink-0 sm:w-auto`}
          disabled={drawDisabled}
          onClick={onDrawRound}
        >
          {hasRounds ? "Nächste Runde auslosen" : "Erste Runde auslosen"}
        </button>
      </div>

      {showHistoricalBanner ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--vibe-fg-base)] sm:px-4 sm:py-3 sm:text-sm">
          <p className="min-w-0 flex-1 font-semibold">
            <span className="hidden sm:inline">
              Du siehst eine vergangene Runde. Zum Auslosen einer neuen Runde zur aktuellen Runde wechseln.
            </span>
            <span className="sm:hidden">Vergangene Runde – zur aktuellen wechseln, um neu auszulosen.</span>
          </p>
          <button
            type="button"
            className={`${subtleBtn} shrink-0`}
            onClick={onJumpToLatest}
          >
            Zur aktuellen Runde
          </button>
        </div>
      ) : null}

      {round ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {round.matches.map((match, index) => (
            <motion.div
              key={match.id}
              className="min-w-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <MatchCard match={match} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--vibe-line-strong)] bg-[var(--vibe-bg-sunken)]/50 p-4 text-center text-xs text-[var(--vibe-fg-muted)] sm:p-6 sm:text-sm">
          <p className="sm:hidden">
            Noch keine Runde ausgelost. Oben <span className="font-semibold">Erste Runde auslosen</span>{" "}
            antippen.
          </p>
          <p className="hidden sm:block">
            Noch keine Runde ausgelost. Klicke oben auf{" "}
            <span className="font-semibold">Erste Runde auslosen</span>, um zu starten.
          </p>
        </div>
      )}
    </section>
  );
}
