"use client";

import { motion } from "framer-motion";
import { MatchCard } from "@/components/turnier/components/MatchCard";
import { actionBtn, subtleBtn, turnierCard } from "@/components/turnier/styles";
import type { RoundEntry } from "@/components/turnier/types";

type DrawViewProps = {
  round: RoundEntry | null;
  isPending: boolean;
  readOnly: boolean;
  isViewingLatestRound: boolean;
  hasRounds: boolean;
  coverageComplete: boolean;
  partnerCovered: number;
  partnerNeeded: number;
  estimatedRoundsTotal: number;
  currentRoundNumber: number | null;
  onDrawRound: () => void;
  onJumpToLatest: () => void;
};

export function DrawView({
  round,
  isPending,
  readOnly,
  isViewingLatestRound,
  hasRounds,
  coverageComplete,
  partnerCovered,
  partnerNeeded,
  estimatedRoundsTotal,
  currentRoundNumber,
  onDrawRound,
  onJumpToLatest,
}: DrawViewProps) {
  const showHistoricalBanner = hasRounds && !isViewingLatestRound;
  const drawDisabled =
    isPending || readOnly || !isViewingLatestRound || coverageComplete;

  return (
    <section className={`${turnierCard} flex min-w-0 flex-col gap-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="truncate text-xl font-black tracking-tight">
            {round ? `Auslosung – Runde ${round.roundNumber}` : "Auslosung"}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Zufällige Teams und zufällige Gegnerpaare. Beim Auslosen wird automatisch zur neuen Runde gesprungen.
          </p>
          {partnerNeeded > 0 ? (
            <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-300">
              <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                Partnerpaare {partnerCovered} / {partnerNeeded}
                {currentRoundNumber != null ? ` · bisher Runde ${currentRoundNumber}` : ""}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                Geschätzt ca. {estimatedRoundsTotal} Runden bis alle Paare einmal zusammen waren (Idealwert, je nach Auslosung variabel).
              </p>
              {coverageComplete ? (
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Alle Partnerpaare erreicht – keine weitere Auslosung vorgesehen. Turnier kann beendet werden.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className={actionBtn}
          disabled={drawDisabled}
          onClick={onDrawRound}
        >
          {hasRounds ? "Nächste Runde auslosen" : "Erste Runde auslosen"}
        </button>
      </div>

      {showHistoricalBanner ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="min-w-0 flex-1 font-semibold">
            Du siehst eine vergangene Runde. Zum Auslosen einer neuen Runde zur aktuellen Runde wechseln.
          </p>
          <button type="button" className={subtleBtn} onClick={onJumpToLatest}>
            Zur aktuellen Runde
          </button>
        </div>
      ) : null}

      {round ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
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
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400">
          Noch keine Runde ausgelost. Klicke oben auf <span className="font-semibold">Erste Runde auslosen</span>, um zu starten.
        </div>
      )}
    </section>
  );
}
