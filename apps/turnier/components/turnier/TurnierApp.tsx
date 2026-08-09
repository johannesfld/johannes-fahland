"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trophy,
  ListChecks,
  Shuffle,
  Users,
  Medal,
  MoreVertical,
  Pause,
  Play,
  Flag,
  LogOut,
  Download,
  Check,
  Table2,
} from "lucide-react";
import { Brandmark } from "@/components/ui/Brandmark";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { OPEN_INSTALL_GUIDE_EVENT } from "@/components/ui/Onboarding";
import { PausedScreenBanner } from "@/components/turnier/components/PausedScreenBanner";
import { RoundNavigator } from "@/components/turnier/components/RoundNavigator";
import { useTournamentActions, useTournamentSync } from "@/components/turnier/hooks";
import { standingsForTournament } from "@/components/turnier/logic";
import { turnierShell } from "@/components/turnier/styles";
import { cn } from "@/components/ui/styles";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import type { TournamentDetail, TournamentStatus } from "@/components/turnier/types";
import { DrawView } from "@/components/turnier/views/DrawView";
import { PodiumView } from "@/components/turnier/views/PodiumView";
import { ScoreEntryView } from "@/components/turnier/views/ScoreEntryView";
import { SetupView } from "@/components/turnier/views/SetupView";
import { StandingsView } from "@/components/turnier/views/StandingsView";
import { getCoverageStats } from "@/lib/turnier/coverage";

type TurnierStep = "setup" | "draw" | "scores" | "table" | "podium";

type TurnierAppProps = {
  initialTournament: TournamentDetail;
};

type StepSpec = {
  id: TurnierStep;
  /** Ordinalzeichen im Stepper (① … 🏆) — leer für den Nebenschritt Tabelle. */
  marker: string;
  label: string;
  icon: typeof Users;
  enabled: boolean;
  /** Teil des Haupt-Flows (nummerierter Stepper) — Tabelle ist kein Flow-Schritt. */
  inFlow: boolean;
};

/**
 * Geführter Flow: Setup → Auslosen → Spielen → Sieger.
 * Die Tabelle ist kein Flow-Schritt, sondern jederzeit als Nebenziel erreichbar.
 * Enabled-Logik bleibt statusabhängig (identisch zur bisherigen buildTabs-Regel).
 */
function buildSteps(status: TournamentStatus): StepSpec[] {
  const setupEnabled = status === "setup" || status === "paused";
  const playEnabled = status === "active" || status === "paused" || status === "finished";
  return [
    { id: "setup", marker: "1", label: "Setup", icon: Users, enabled: setupEnabled, inFlow: true },
    { id: "draw", marker: "2", label: "Auslosen", icon: Shuffle, enabled: playEnabled, inFlow: true },
    { id: "scores", marker: "3", label: "Spielen", icon: ListChecks, enabled: playEnabled, inFlow: true },
    ...(status === "finished"
      ? [
          {
            id: "podium" as TurnierStep,
            marker: "🏆",
            label: "Sieger",
            icon: Medal,
            enabled: true,
            inFlow: true,
          },
        ]
      : []),
    { id: "table", marker: "", label: "Tabelle", icon: Table2, enabled: true, inFlow: false },
  ];
}

export function TurnierApp({ initialTournament }: TurnierAppProps) {
  const [step, setStep] = useState<TurnierStep>(() =>
    initialTournament.status === "setup" || initialTournament.status === "paused"
      ? "setup"
      : initialTournament.status === "finished"
        ? "podium"
        : "draw",
  );
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const steps = useMemo(() => buildSteps(tournament.status), [tournament.status]);
  const flowSteps = useMemo(() => steps.filter((s) => s.inFlow), [steps]);
  const activeFlowIndex = flowSteps.findIndex((s) => s.id === step);

  useEffect(() => {
    if (tournament.status === "active" && step === "setup") {
      setStep("draw");
      return;
    }
    if (tournament.status === "setup" && step !== "setup" && step !== "table") {
      setStep("setup");
    }
  }, [step, tournament.status]);

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

  const statusDotClass =
    tournament.status === "active"
      ? "bg-[var(--ok)]"
      : tournament.status === "paused"
        ? "bg-[var(--warn)]"
        : tournament.status === "finished"
          ? "bg-[var(--vibe-fg-faint)]"
          : "bg-[var(--accent)]";

  const showPauseOverlayOnContent =
    tournament.status === "paused" && (step === "draw" || step === "scores" || step === "podium");

  const partnerLabel = tournament.format === "doubles" ? "Partnerpaare" : "Gegnerpaare";
  const tableStep = steps.find((s) => s.id === "table")!;

  return (
    <ToolShell className={turnierShell}>
      <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-4 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-6 sm:pt-5 lg:gap-5 lg:px-8 lg:pt-6 desk:pb-10">
        {/* --- Sticky-Header (saubere Full-Width-Bar, kein -mx-Bleed) --- */}
        {/* z-40 > Bottom-Nav (z-30): sticky+z-index erzeugt einen Stacking-Context,
            in dem das Aktionsmenü gefangen ist. Mit z-30 lag die später im DOM
            stehende Bottom-Nav darüber und verdeckte die unteren Menüpunkte. */}
        <header className="sticky top-0 z-40 min-w-0 border-b border-[var(--vibe-line)] bg-[var(--vibe-bg-base)]/90 pb-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/"
              aria-label="Zur Turnierübersicht"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--vibe-r-md)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--vibe-shadow-soft)] transition-transform duration-200 [transition-timing-function:var(--vibe-ease-spring)] active:scale-[0.92] desk:h-9 desk:w-9"
            >
              <Brandmark size={20} />
            </Link>
            <h1 className="mr-auto min-w-0 truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              {tournament.name}
            </h1>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em]",
                statusToneClass,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClass)} />
              {statusLabel}
            </span>

            {/* Overflow-Menü */}
            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Aktionen"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-soft)] transition-transform duration-200 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:text-[var(--vibe-fg-base)] active:scale-[0.92]"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              <AnimatePresence>
                {menuOpen ? (
                  <>
                    <button
                      type="button"
                      aria-hidden
                      tabIndex={-1}
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex w-56 flex-col gap-1 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-overlay)] p-2 shadow-[var(--vibe-shadow-lifted)]"
                    >
                      {tournament.status !== "finished" ? (
                        tournament.status !== "paused" ? (
                          <MenuItem
                            icon={Pause}
                            label="Pausieren"
                            onClick={() => {
                              actions.pauseTournament();
                              setMenuOpen(false);
                            }}
                          />
                        ) : (
                          <MenuItem
                            icon={Play}
                            label="Fortsetzen"
                            accent
                            onClick={() => {
                              actions.resumeTournament();
                              setMenuOpen(false);
                            }}
                          />
                        )
                      ) : null}
                      {tournament.status !== "finished" ? (
                        <MenuItem
                          icon={Flag}
                          label="Turnier beenden"
                          danger
                          onClick={() => {
                            setMenuOpen(false);
                            setConfirmFinish(true);
                          }}
                        />
                      ) : null}
                      <MenuItem
                        icon={Download}
                        label="Turnier installieren"
                        onClick={() => {
                          setMenuOpen(false);
                          window.dispatchEvent(new Event(OPEN_INSTALL_GUIDE_EVENT));
                        }}
                      />
                      <div className="my-1 h-px bg-[var(--vibe-line)]" />
                      <MenuItem icon={LogOut} label="Verlassen" href="/" />
                    </motion.div>
                  </>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* --- Fortschritts-Stepper (EINE Nav-Quelle, Flow + Sprung-Nav) --- */}
        <nav aria-label="Turnier-Fortschritt" className="min-w-0">
          <ol className="flex min-w-0 items-stretch gap-1.5 sm:gap-2">
            {flowSteps.map((entry, index) => {
              const isActive = step === entry.id;
              const isDone = activeFlowIndex >= 0 && index < activeFlowIndex && entry.id !== "podium";
              const Icon = entry.icon;
              return (
                <li key={entry.id} className="flex min-w-0 flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => entry.enabled && setStep(entry.id)}
                    disabled={!entry.enabled}
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "group flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--vibe-r-xl)] border px-1.5 py-2 transition-[transform,background-color,border-color,color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35",
                      isActive
                        ? "border-transparent bg-[var(--accent)] text-[var(--accent-ink)] shadow-[var(--vibe-shadow-clay)]"
                        : isDone
                          ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-soft)] [@media(hover:hover)]:hover:border-[var(--accent-line)] [@media(hover:hover)]:hover:text-[var(--vibe-fg-base)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                        isActive
                          ? "bg-[var(--accent-ink)]/20 text-[var(--accent-ink)]"
                          : isDone
                            ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                            : "bg-[var(--vibe-bg-sunken)] text-[var(--vibe-fg-faint)] group-disabled:bg-transparent",
                      )}
                    >
                      {isDone ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : entry.marker === "🏆" ? (
                        <Icon className="h-3.5 w-3.5" strokeWidth={2.6} />
                      ) : (
                        entry.marker
                      )}
                    </span>
                    <span className="min-w-0 truncate text-[11px] font-bold tracking-tight sm:text-xs">
                      {entry.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* --- View-Inhalt (genau EIN Schritt sichtbar) --- */}
        {step === "setup" ? (
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

        {step === "draw" ? (
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

        {step === "scores" ? (
          <div className="relative flex min-w-0 flex-col gap-4">
            {/* Runden-Navigator + Coverage — im Spielen-Schritt, nicht im Header */}
            {roundNumbers.length > 0 || partnerStats.needed > 0 ? (
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
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
                {partnerStats.needed > 0 ? (
                  <p className="min-w-0 text-xs text-[var(--vibe-fg-muted)]">
                    <span className="font-bold text-[var(--vibe-fg-base)]">
                      {partnerLabel} {partnerStats.covered}/{partnerStats.needed}
                    </span>
                    <span className="hidden text-[var(--vibe-fg-faint)] sm:inline">
                      {" "}
                      · ~{partnerStats.estimatedRoundsTotal} Runden für alle
                    </span>
                    {partnerStats.complete ? (
                      <span className="font-bold text-[var(--ok-ink)]"> · komplett</span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            ) : null}
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

        {step === "table" ? (
          <div className="flex min-w-0 flex-col gap-4">
            {roundNumbers.length > 0 ? (
              <div className="flex min-w-0">
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
              </div>
            ) : null}
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
          </div>
        ) : null}

        {step === "podium" && tournament.status === "finished" ? (
          <div className="relative min-w-0">
            {showPauseOverlayOnContent ? <PausedScreenBanner /> : null}
            <PodiumView standings={standings} onShowTable={() => setStep("table")} />
          </div>
        ) : null}
      </div>

      {/* --- Mobile: kompakte fixe Bottom-Nav (relevante Sprungziele) --- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--vibe-line)] bg-[var(--vibe-bg-base)]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.375rem)] pt-1.5 backdrop-blur-md desk:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around gap-0.5">
          {steps.map((entry) => {
            const Icon = entry.icon;
            const isActive = step === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => entry.enabled && setStep(entry.id)}
                disabled={!entry.enabled}
                aria-current={isActive ? "step" : undefined}
                aria-label={entry.label}
                className={cn(
                  "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--vibe-r-lg)] px-1 py-1.5 transition-[transform,color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] active:scale-[0.92] disabled:opacity-30 disabled:pointer-events-none",
                  isActive ? "text-[var(--accent)]" : "text-[var(--vibe-fg-faint)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200",
                    isActive ? "bg-[var(--accent-soft)]" : "bg-transparent",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.6 : 2.2} />
                </span>
                <span className="text-[10px] font-bold tracking-tight">{entry.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- Desktop: Tabelle als jederzeit erreichbares Nebenziel (Stepper zeigt nur Flow) --- */}
      <button
        type="button"
        onClick={() => setStep("table")}
        aria-current={step === "table" ? "true" : undefined}
        className={cn(
          "fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full border px-4 py-3 text-sm font-bold tracking-tight shadow-[var(--vibe-shadow-lifted)] transition-[transform,background-color,color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] active:scale-[0.96] desk:inline-flex",
          step === "table"
            ? "border-transparent bg-[var(--accent)] text-[var(--accent-ink)]"
            : "border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-base)] [@media(hover:hover)]:hover:border-[var(--accent-line)]",
        )}
      >
        <Trophy className="h-4 w-4" strokeWidth={2.4} />
        {tableStep.label}
      </button>

      <ConfirmModal
        open={confirmFinish}
        title="Turnier beenden?"
        body="Das Endergebnis wird festgeschrieben und kann nicht mehr geändert werden."
        confirmLabel="Ja, beenden"
        cancelLabel="Abbrechen"
        tone="danger"
        onConfirm={() => {
          actions.finishTournament();
          setConfirmFinish(false);
        }}
        onCancel={() => setConfirmFinish(false)}
      />
    </ToolShell>
  );
}

type MenuItemProps = {
  icon: typeof Users;
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  accent?: boolean;
};

function MenuItem({ icon: Icon, label, onClick, href, danger, accent }: MenuItemProps) {
  const classes = cn(
    "inline-flex min-h-11 w-full items-center gap-3 rounded-[var(--vibe-r-lg)] px-3 py-2 text-sm font-semibold transition-[transform,background-color,color] duration-150 active:scale-[0.97]",
    danger
      ? "text-[var(--danger-ink)] [@media(hover:hover)]:hover:bg-[var(--danger-soft)]"
      : accent
        ? "text-[var(--accent)] [@media(hover:hover)]:hover:bg-[var(--accent-soft)]"
        : "text-[var(--vibe-fg-base)] [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)]",
  );
  const inner = (
    <>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.4} />
      {label}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}
