"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PausedScreenBanner } from "@/components/turnier/components/PausedScreenBanner";
import { RoundNavigator } from "@/components/turnier/components/RoundNavigator";
import { useTournamentActions, useTournamentSync } from "@/components/turnier/hooks";
import { standingsForTournament } from "@/components/turnier/logic";
import { actionBtn, dangerBtn, subtleBtn, turnierShell } from "@/components/turnier/styles";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import type { TournamentDetail, TournamentStatus } from "@/components/turnier/types";
import { DrawView } from "@/components/turnier/views/DrawView";
import { PodiumView } from "@/components/turnier/views/PodiumView";
import { ScoreEntryView } from "@/components/turnier/views/ScoreEntryView";
import { SetupView } from "@/components/turnier/views/SetupView";
import { StandingsView } from "@/components/turnier/views/StandingsView";
import { getCoverageStats } from "@/lib/turnier/coverage";

type TurnierTab = "setup" | "draw" | "scores" | "table" | "podium";

type TurnierAppProps = {
  initialTournament: TournamentDetail;
};

type TabSpec = {
  id: TurnierTab;
  label: string;
  enabled: boolean;
};

function buildTabs(status: TournamentStatus): TabSpec[] {
  const setupEnabled = status === "setup" || status === "paused";
  const playEnabled = status === "active" || status === "paused" || status === "finished";
  return [
    { id: "setup", label: "Setup", enabled: setupEnabled },
    { id: "draw", label: "Auslosung", enabled: playEnabled },
    { id: "scores", label: "Ergebnisse", enabled: playEnabled },
    { id: "table", label: "Tabelle", enabled: true },
    ...(status === "finished"
      ? [{ id: "podium" as TurnierTab, label: "Siegerehrung", enabled: true }]
      : []),
  ];
}

export function TurnierApp({ initialTournament }: TurnierAppProps) {
  const [tab, setTab] = useState<TurnierTab>(() =>
    initialTournament.status === "setup" || initialTournament.status === "paused"
      ? "setup"
      : initialTournament.status === "finished"
        ? "table"
        : "draw",
  );
  const [confirmFinish, setConfirmFinish] = useState(false);

  const { tournament, refresh } = useTournamentSync(initialTournament.id, initialTournament);
  const actions = useTournamentActions(tournament.id, refresh);
  const standings = useMemo(() => standingsForTournament(tournament), [tournament]);
  const canEditTournament = tournament.status === "active";

  const activePlayerIds = useMemo(
    () => tournament.players.filter((p) => p.active).map((p) => p.id),
    [tournament.players],
  );
  // Coverage (Partner-/Gegnerpaare) ist nur im Reihum-Modus sinnvoll.
  const isRoundRobin = tournament.mode === "round_robin";
  const partnerStats = useMemo(
    () =>
      isRoundRobin
        ? getCoverageStats(tournament.rounds, activePlayerIds, tournament.format)
        : { activeCount: activePlayerIds.length, covered: 0, needed: 0, complete: false, estimatedRoundsTotal: 0 },
    [isRoundRobin, tournament.rounds, activePlayerIds, tournament.format],
  );

  const roundNumbers = useMemo(
    () => tournament.rounds.map((round) => round.roundNumber),
    [tournament.rounds],
  );
  const latestRoundNumber = roundNumbers[roundNumbers.length - 1] ?? null;
  const [viewedRoundNumber, setViewedRoundNumber] = useState<number | null>(latestRoundNumber);
  const previousRoundCountRef = useRef(roundNumbers.length);

  const tabs = useMemo(() => buildTabs(tournament.status), [tournament.status]);

  useEffect(() => {
    if (tournament.status === "active" && tab === "setup") {
      setTab("draw");
      return;
    }
    if (tournament.status === "setup" && tab !== "setup" && tab !== "table") {
      setTab("setup");
    }
  }, [tab, tournament.status]);

  useEffect(() => {
    if (roundNumbers.length === 0) {
      setViewedRoundNumber(null);
      previousRoundCountRef.current = 0;
      return;
    }
    if (roundNumbers.length > previousRoundCountRef.current) {
      const newest = roundNumbers[roundNumbers.length - 1];
      setViewedRoundNumber(newest);
    } else if (viewedRoundNumber == null || !roundNumbers.includes(viewedRoundNumber)) {
      setViewedRoundNumber(roundNumbers[roundNumbers.length - 1]);
    }
    previousRoundCountRef.current = roundNumbers.length;
  }, [roundNumbers, viewedRoundNumber]);

  useEffect(() => {
    if (tournament.status === "finished") setConfirmFinish(false);
  }, [tournament.status]);

  const selectedRound =
    tournament.rounds.find((round) => round.roundNumber === viewedRoundNumber) ?? null;
  const isViewingLatestRound =
    roundNumbers.length === 0 ||
    (latestRoundNumber != null && viewedRoundNumber === latestRoundNumber);

  const tableStandings = useMemo(
    () => standingsForTournament(tournament, viewedRoundNumber),
    [tournament, viewedRoundNumber],
  );

  const statusLabel =
    tournament.status === "setup"
      ? "Setup"
      : tournament.status === "active"
        ? "Läuft"
        : tournament.status === "paused"
          ? "Pausiert"
          : "Beendet";

  const statusToneClass =
    tournament.status === "active"
      ? "border-[var(--ok)]/40 bg-[var(--ok-soft)] text-[var(--ok-ink)]"
      : tournament.status === "paused"
        ? "border-[var(--warn)]/40 bg-[var(--warn-soft)] text-[var(--warn-ink)]"
        : tournament.status === "finished"
          ? "border-[var(--vibe-line)] bg-[var(--neutral-soft)] text-[var(--neutral-ink)]"
          : "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)]";

  const showPauseOverlayOnContent =
    tournament.status === "paused" && (tab === "draw" || tab === "scores" || tab === "podium");

  return (
    <ToolShell className={turnierShell}>
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-4 px-4 pt-4 pb-8 sm:px-6 sm:pt-5 sm:pb-10 lg:gap-5 lg:px-8 lg:pt-6">
        <header className="sticky top-0 z-20 -mx-4 flex min-w-0 flex-col gap-3 border-b border-[var(--vibe-line)] bg-[var(--vibe-bg-base)]/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="mr-auto min-w-0 truncate font-display text-2xl font-medium tracking-tight sm:text-3xl">
              {tournament.name}
            </h1>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] sm:text-xs sm:py-2 ${statusToneClass}`}
            >
              {statusLabel}
            </span>
            {roundNumbers.length > 0 ? (
              <RoundNavigator
                rounds={roundNumbers}
                activeRound={viewedRoundNumber}
                onPrev={() =>
                  setViewedRoundNumber((prev) => {
                    if (prev == null) return prev;
                    const idx = roundNumbers.indexOf(prev);
                    if (idx <= 0) return prev;
                    return roundNumbers[idx - 1];
                  })
                }
                onNext={() =>
                  setViewedRoundNumber((prev) => {
                    if (prev == null) return prev;
                    const idx = roundNumbers.indexOf(prev);
                    if (idx < 0 || idx >= roundNumbers.length - 1) return prev;
                    return roundNumbers[idx + 1];
                  })
                }
                onPick={setViewedRoundNumber}
              />
            ) : null}
          </div>

          {partnerStats.needed > 0 ? (
            <p className="text-xs text-[var(--vibe-fg-muted)]">
              <span className="font-semibold text-[var(--vibe-fg-base)]">
                {tournament.format === "doubles" ? "Partnerpaare" : "Gegnerpaare"}{" "}
                {partnerStats.covered} / {partnerStats.needed}
              </span>
              {roundNumbers.length > 0 ? (
                <span className="text-[var(--vibe-fg-faint)]">
                  {" "}
                  · ausgelost: Runde {latestRoundNumber} · geschätzt insgesamt ca.{" "}
                  {partnerStats.estimatedRoundsTotal} Runden für alle{" "}
                  {tournament.format === "doubles" ? "Partnerpaare" : "Gegnerpaare"}
                </span>
              ) : (
                <span className="text-[var(--vibe-fg-faint)]">
                  {" "}
                  · geschätzt ca. {partnerStats.estimatedRoundsTotal} Runden bis alle{" "}
                  {tournament.format === "doubles" ? "Partnerpaare" : "Gegnerpaare"}
                </span>
              )}
              {partnerStats.complete ? (
                <span className="font-semibold text-[var(--ok)]"> – komplett</span>
              ) : null}
            </p>
          ) : null}

          <AnimatePresence initial={false} mode="wait">
            {confirmFinish ? (
              <motion.div
                key="confirm-finish"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-w-0 flex-col gap-2 rounded-2xl border border-red-300 bg-red-50/80 p-3 text-sm text-red-900 sm:flex-row sm:items-center sm:gap-3 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
              >
                <p className="min-w-0 flex-1 font-semibold">
                  Turnier wirklich beenden? Das Endergebnis wird festgeschrieben.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={subtleBtn}
                    onClick={() => setConfirmFinish(false)}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    className={dangerBtn}
                    onClick={() => {
                      actions.finishTournament();
                      setConfirmFinish(false);
                    }}
                  >
                    Ja, beenden
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-w-0 flex-wrap items-center gap-2"
              >
                <Link
                  href="/"
                  className={`${subtleBtn} hover:border-red-400 hover:text-red-600`}
                >
                  Verlassen
                </Link>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {tournament.status !== "finished" ? (
                    tournament.status !== "paused" ? (
                      <button
                        type="button"
                        className={subtleBtn}
                        onClick={actions.pauseTournament}
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={actionBtn}
                        onClick={actions.resumeTournament}
                      >
                        Fortsetzen
                      </button>
                    )
                  ) : null}
                  {tournament.status !== "finished" ? (
                    <button
                      type="button"
                      className={`${subtleBtn} hover:border-red-400 hover:text-red-600`}
                      onClick={() => setConfirmFinish(true)}
                    >
                      Beenden
                    </button>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <nav
          className={
            tournament.status === "finished"
              ? "grid min-w-0 grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2"
              : "grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2"
          }
        >
          {tabs.map((entry) => {
            const isActive = tab === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                disabled={!entry.enabled}
                aria-pressed={isActive}
                className={`${isActive ? actionBtn : subtleBtn} truncate px-2 sm:px-4`}
              >
                {entry.label}
              </button>
            );
          })}
        </nav>

        {tab === "setup" ? (
          <SetupView
            tournament={tournament}
            isPending={actions.isPending}
            isPaused={tournament.status === "paused"}
            onAddPlayer={actions.addPlayer}
            onRemovePlayer={actions.removePlayer}
            onReactivatePlayer={actions.reactivatePlayer}
            onStartTournament={actions.startTournament}
            onBestOfChange={actions.updateBestOf}
          />
        ) : null}

        {tab === "draw" ? (
          <div className="relative min-w-0">
            {showPauseOverlayOnContent ? <PausedScreenBanner /> : null}
            <DrawView
              round={selectedRound}
              format={tournament.format}
              mode={tournament.mode}
              isPending={actions.isPending}
              readOnly={!canEditTournament}
              isViewingLatestRound={isViewingLatestRound}
              hasRounds={roundNumbers.length > 0}
              coverageComplete={partnerStats.complete}
              pairCovered={partnerStats.covered}
              pairNeeded={partnerStats.needed}
              estimatedRoundsTotal={partnerStats.estimatedRoundsTotal}
              currentRoundNumber={latestRoundNumber}
              onDrawRound={actions.drawRound}
              onJumpToLatest={() =>
                latestRoundNumber != null ? setViewedRoundNumber(latestRoundNumber) : null
              }
            />
          </div>
        ) : null}

        {tab === "scores" ? (
          <div className="relative min-w-0">
            {showPauseOverlayOnContent ? <PausedScreenBanner /> : null}
            <ScoreEntryView
              round={selectedRound}
              bestOf={tournament.bestOf}
              isPending={actions.isPending}
              readOnly={!canEditTournament || selectedRound?.status === "completed"}
              onSaveAndCompleteMatch={actions.saveAndCompleteMatch}
              onCompleteRound={actions.completeRound}
            />
          </div>
        ) : null}

        {tab === "table" ? (
          <StandingsView
            rows={tableStandings}
            tournament={tournament}
            viewedRoundNumber={viewedRoundNumber}
            latestRoundNumber={latestRoundNumber}
            isViewingLatestRound={isViewingLatestRound}
            hasRounds={roundNumbers.length > 0}
            onJumpToLatest={() =>
              latestRoundNumber != null ? setViewedRoundNumber(latestRoundNumber) : null
            }
          />
        ) : null}

        {tab === "podium" && tournament.status === "finished" ? (
          <div className="relative min-w-0">
            {showPauseOverlayOnContent ? <PausedScreenBanner /> : null}
            <PodiumView standings={standings} onShowTable={() => setTab("table")} />
          </div>
        ) : null}
      </div>
    </ToolShell>
  );
}
