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

type TurnierTab = "setup" | "draw" | "scores" | "table" | "podium";

type TurnierAppProps = {
  initialTournament: TournamentDetail;
};

type TabSpec = {
  id: TurnierTab;
  label: string;
  icon: typeof Users;
  enabled: boolean;
};

function buildTabs(status: TournamentStatus): TabSpec[] {
  const setupEnabled = status === "setup" || status === "paused";
  const playEnabled = status === "active" || status === "paused" || status === "finished";
  return [
    { id: "setup", label: "Setup", icon: Users, enabled: setupEnabled },
    { id: "draw", label: "Auslosung", icon: Shuffle, enabled: playEnabled },
    { id: "scores", label: "Ergebnisse", icon: ListChecks, enabled: playEnabled },
    { id: "table", label: "Tabelle", icon: Trophy, enabled: true },
    ...(status === "finished"
      ? [{ id: "podium" as TurnierTab, label: "Sieger", icon: Medal, enabled: true }]
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

  const statusDotClass =
    tournament.status === "active"
      ? "bg-[var(--ok)]"
      : tournament.status === "paused"
        ? "bg-[var(--warn)]"
        : tournament.status === "finished"
          ? "bg-[var(--vibe-fg-faint)]"
          : "bg-[var(--accent)]";

  const showPauseOverlayOnContent =
    tournament.status === "paused" && (tab === "draw" || tab === "scores" || tab === "podium");

  const partnerLabel = tournament.format === "doubles" ? "Partnerpaare" : "Gegnerpaare";

  return (
    <ToolShell className={turnierShell}>
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-4 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:px-6 sm:pt-5 lg:gap-5 lg:px-8 lg:pt-6 lg:pb-10">
        {/* --- Kompakter Sticky-Header --- */}
        <header className="sticky top-0 z-30 -mx-4 flex min-w-0 flex-col gap-2 border-b border-[var(--vibe-line)] bg-[var(--vibe-bg-base)]/90 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/"
              aria-label="Zur Turnierübersicht"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--vibe-r-md)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--vibe-shadow-soft)] transition-transform duration-200 [transition-timing-function:var(--vibe-ease-spring)] active:scale-[0.92]"
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

          {/* Runden-Navigator + Coverage-Hinweis (kompakt, eigene Zeile) */}
          {roundNumbers.length > 0 || partnerStats.needed > 0 ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
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
        </header>

        {/* --- Desktop: Segmented-Tab-Bar oben --- */}
        <nav className="hidden min-w-0 desk:flex">
          <div className="flex min-w-0 flex-wrap gap-1.5 rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-1.5 shadow-[var(--vibe-shadow-soft)]">
            {tabs.map((entry) => {
              const Icon = entry.icon;
              const isActive = tab === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setTab(entry.id)}
                  disabled={!entry.enabled}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-[var(--vibe-r-xl)] px-4 py-2 text-sm font-bold tracking-tight transition-[transform,background-color,color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none",
                    isActive
                      ? "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[var(--vibe-shadow-clay)]"
                      : "text-[var(--vibe-fg-muted)] [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)] [@media(hover:hover)]:hover:text-[var(--vibe-fg-base)]",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                  {entry.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* --- View-Inhalt --- */}
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

      {/* --- Mobile: fixe Bottom-Tab-Bar --- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--vibe-line)] bg-[var(--vibe-bg-base)]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.375rem)] pt-1.5 backdrop-blur-md desk:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around gap-0.5">
          {tabs.map((entry) => {
            const Icon = entry.icon;
            const isActive = tab === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                disabled={!entry.enabled}
                aria-pressed={isActive}
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
