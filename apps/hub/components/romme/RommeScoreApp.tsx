"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw, SquareStack, Trophy, UserPlus, X } from "lucide-react";
import { rommeDisplay } from "@/components/romme/romme-display-font";
import {
  clearRommeState,
  loadRommeState,
  saveRommeState,
} from "@/components/romme/storage";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { cn } from "@/components/ui/styles";

const ease = [0.22, 1, 0.36, 1] as const;

const NARROW_MQ = "(max-width: 639px)";

function subscribeNarrow(callback: () => void) {
  const mq = window.matchMedia(NARROW_MQ);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getNarrowSnapshot() {
  return window.matchMedia(NARROW_MQ).matches;
}

function getNarrowServerSnapshot() {
  return false;
}

function useIsNarrowViewport() {
  return useSyncExternalStore(subscribeNarrow, getNarrowSnapshot, getNarrowServerSnapshot);
}

type RommeRound = {
  winnerIndex: number | null;
  scores: (number | null)[];
};

function emptyRound(playerCount: number): RommeRound {
  return {
    winnerIndex: null,
    scores: Array.from({ length: playerCount }, () => null),
  };
}

function isRoundComplete(round: RommeRound, playerCount: number): boolean {
  if (round.winnerIndex === null) return false;
  for (let i = 0; i < playerCount; i++) {
    if (i === round.winnerIndex) continue;
    if (round.scores[i] === null) return false;
  }
  return true;
}

/** Beitrag zur Summe: null = Runde zählt für diesen Spieler noch nicht. */
function scoreForTotal(round: RommeRound, playerIndex: number): number | null {
  if (round.winnerIndex === null) return null;
  if (round.winnerIndex === playerIndex) return 0;
  const v = round.scores[playerIndex];
  return v === null ? null : v;
}

function WinnerTrophyDisplay({
  interactive,
  onClick,
}: {
  interactive: boolean;
  onClick?: () => void;
}) {
  const icon = (
    <Trophy
      className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--accent)]"
      strokeWidth={2}
      aria-hidden
    />
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--vibe-r-lg)] border border-[var(--accent-line)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
        aria-label="Gewinner, erneut wählen"
      >
        {icon}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center justify-center text-[var(--accent)]" aria-hidden>
      {icon}
    </span>
  );
}

export default function RommeScoreApp() {
  const isNarrow = useIsNarrowViewport();

  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [gamePlayerNames, setGamePlayerNames] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [rounds, setRounds] = useState<RommeRound[]>([]);
  const isHydrated = useRef(false);

  useEffect(() => {
    const saved = loadRommeState();
    if (saved) {
      setPlayerNames(saved.playerNames);
      setGamePlayerNames(saved.playerNames);
      setRounds(saved.rounds);
      setIsStarted(saved.isStarted);
    }
    isHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!isHydrated.current) return;
    saveRommeState({ playerNames: gamePlayerNames, rounds, isStarted });
  }, [gamePlayerNames, rounds, isStarted]);

  const playerCount = gamePlayerNames.length;

  const dealerIndex = useMemo(() => {
    if (!isStarted || rounds.length === 0) return 0;
    return (rounds.length - 1) % playerCount;
  }, [isStarted, rounds.length, playerCount]);

  const totals = useMemo(() => {
    if (!isStarted || playerCount === 0) return [];
    return gamePlayerNames.map((_, pi) =>
      rounds.reduce((acc, round) => {
        const v = scoreForTotal(round, pi);
        if (v === null) return acc;
        return acc + v;
      }, 0),
    );
  }, [gamePlayerNames, isStarted, playerCount, rounds]);

  const hasCompleteRound = useMemo(
    () => rounds.some((r) => isRoundComplete(r, playerCount)),
    [rounds, playerCount],
  );

  const leaderIndices = useMemo(() => {
    if (!hasCompleteRound || totals.length === 0) return new Set<number>();
    const min = Math.min(...totals);
    return new Set(totals.map((t, i) => (t === min ? i : -1)).filter((i) => i >= 0));
  }, [hasCompleteRound, totals]);

  const canAddRound = useMemo(() => {
    if (!isStarted || rounds.length === 0 || playerCount === 0) return false;
    return isRoundComplete(rounds[rounds.length - 1], playerCount);
  }, [isStarted, playerCount, rounds]);

  const initGame = () => {
    const finalizedNames = playerNames.map((name, i) => name.trim() || `Spieler ${i + 1}`);
    setGamePlayerNames(finalizedNames);
    setRounds([emptyRound(finalizedNames.length)]);
    setIsStarted(true);
  };

  const resetAll = () => {
    clearRommeState();
    setPlayerNames(["", ""]);
    setGamePlayerNames([]);
    setRounds([]);
    setIsStarted(false);
  };

  const setWinner = (roundIndex: number, playerIndex: number) => {
    setRounds((prev) => {
      const next = prev.map((r, ri) => {
        if (ri !== roundIndex) return r;
        const scores = [...r.scores];
        if (r.winnerIndex === playerIndex) {
          scores[playerIndex] = null;
          return { winnerIndex: null, scores };
        }
        scores[playerIndex] = 0;
        if (r.winnerIndex !== null && r.winnerIndex !== playerIndex) {
          scores[r.winnerIndex] = null;
        }
        return { winnerIndex: playerIndex, scores };
      });
      return next;
    });
  };

  const setScore = (roundIndex: number, playerIndex: number, raw: string) => {
    setRounds((prev) => {
      const next = prev.map((r, ri) => {
        if (ri !== roundIndex) return r;
        if (r.winnerIndex === playerIndex) return r;
        const scores = [...r.scores];
        const val = raw === "" ? null : Number(raw);
        scores[playerIndex] = raw === "" || Number.isNaN(val) ? null : val;
        return { ...r, scores };
      });
      return next;
    });
  };

  const addRound = () => {
    if (!canAddRound) return;
    setRounds((prev) => [...prev, emptyRound(playerCount)]);
  };

  const ring =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2";

  const colPct = playerCount > 0 ? `${90 / playerCount}%` : "22%";

  /** Schmal & ab 4 Spielern: min. 25vw pro Spieler (~4 Spalten sichtbar), horizontal scrollen. */
  const narrowManyPlayersScroll =
    isStarted && isNarrow && playerCount >= 4;
  const narrowTableMinWidth = narrowManyPlayersScroll
    ? (`calc(2.75rem + ${playerCount} * 25vw)` as const)
    : undefined;
  const narrowPlayerColShare =
    isStarted && isNarrow && playerCount > 0 && playerCount < 4
      ? (`calc((100% - 2.75rem) / ${playerCount})` as const)
      : undefined;

  return (
    <ToolShell tool="romme" fullBleed className={`${rommeDisplay.variable}`}>
      <div className="flex h-full min-h-0 w-full flex-col px-3 pt-3 sm:px-6 sm:pt-5">
      {/* Header — kompakter und shrink-0 */}
      <header className="mx-auto mb-3 flex w-full max-w-5xl shrink-0 items-center justify-between sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--vibe-r-md)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] sm:h-10 sm:w-10">
            <SquareStack size={18} className="text-[var(--accent)] sm:h-5 sm:w-5" aria-hidden />
          </div>
          <div>
            <h1
              className={cn(
                rommeDisplay.className,
                "font-bold uppercase tracking-tight leading-none text-[var(--accent)]",
                "text-2xl sm:text-4xl",
              )}
            >
              Rommé
            </h1>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)] opacity-60">
              Punkte
            </p>
          </div>
        </div>
        {isStarted && (
          <button
            type="button"
            onClick={resetAll}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--vibe-r-md)] px-3 py-2 text-xs font-semibold",
              "text-[var(--vibe-fg-faint)] transition-colors hover:text-red-500",
              ring,
            )}
          >
            <RotateCcw size={13} aria-hidden />
            Reset
          </button>
        )}
      </header>

      <main
        className={cn(
          "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col",
          isStarted ? "overflow-hidden" : "overflow-y-auto pb-4",
        )}
      >
        <AnimatePresence mode="wait">
          {!isStarted ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease }}
            >
              <div className="rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-6 shadow-[var(--vibe-shadow-soft)]">
                <h2 className="mb-5 text-lg font-semibold tracking-tight">Wer spielt mit?</h2>
                <div className="grid gap-2.5 mb-6">
                  {playerNames.map((name, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={name}
                        onChange={(e) => {
                          const n = [...playerNames];
                          n[i] = e.target.value;
                          setPlayerNames(n);
                        }}
                        placeholder={`Spieler ${i + 1}`}
                        className={cn(
                          "flex-1 min-h-11 rounded-[var(--vibe-r-md)] border border-[var(--vibe-line)]",
                          "bg-[var(--vibe-bg-sunken)] px-3 text-sm text-[var(--vibe-fg-base)]",
                          "placeholder:text-[var(--vibe-fg-faint)]",
                          "focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25",
                          "transition-colors",
                        )}
                      />
                      {playerNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPlayerNames(playerNames.filter((_, idx) => idx !== i))}
                          className="flex h-11 w-11 items-center justify-center rounded-[var(--vibe-r-md)] text-[var(--vibe-fg-faint)] transition-colors hover:text-red-500"
                          aria-label="Spieler entfernen"
                        >
                          <X size={16} aria-hidden />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPlayerNames([...playerNames, ""])}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] transition-opacity hover:opacity-75"
                  >
                    <UserPlus size={15} aria-hidden />
                    Spieler hinzufügen
                  </button>
                </div>
                <button
                  type="button"
                  onClick={initGame}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-[var(--vibe-r-lg)]",
                    "bg-[var(--accent)] py-3.5 text-sm font-bold text-[var(--accent-ink)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
                    "transition-all hover:brightness-95 active:scale-[0.985]",
                    ring,
                  )}
                >
                  <Play size={16} aria-hidden />
                  SPIEL STARTEN
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-auto rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] shadow-[var(--vibe-shadow-soft)]">
                <table
                  style={narrowTableMinWidth ? { minWidth: narrowTableMinWidth } : undefined}
                  className={cn(
                    rommeDisplay.className,
                    "border-collapse text-xs sm:text-sm",
                    narrowManyPlayersScroll ? "w-max min-w-full table-fixed" : "w-full min-w-0 table-fixed",
                  )}
                >
                  <colgroup>
                    <col className="w-[2.75rem] min-w-[2.5rem] shrink-0" />
                    {gamePlayerNames.map((_, i) => (
                      <col
                        key={i}
                        style={
                          narrowPlayerColShare
                            ? { width: narrowPlayerColShare }
                            : isNarrow
                              ? { width: "25vw", minWidth: "4.25rem" }
                              : { width: colPct }
                        }
                      />
                    ))}
                  </colgroup>
                  <thead className="sticky top-0 z-30">
                    <tr className="border-b border-[var(--vibe-line)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] backdrop-blur-sm">
                      <th
                        scope="col"
                        className="sticky left-0 top-0 z-40 bg-[var(--vibe-bg-sunken)] border-r border-[var(--vibe-line)] px-1 py-3 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-[var(--vibe-fg-faint)] sm:px-2 sm:text-[10px]"
                      >
                        #
                      </th>
                      {gamePlayerNames.map((name, i) => (
                        <th
                          key={i}
                          scope="col"
                          className="min-w-0 bg-[color-mix(in_srgb,var(--accent)_6%,var(--vibe-bg-elevated))] px-1 py-3 text-center align-middle text-[10px] font-semibold uppercase leading-tight tracking-wide text-[var(--vibe-fg-base)] sm:px-2 sm:text-xs"
                        >
                          <span className="relative inline-flex items-center justify-center gap-0">
                            <span className="line-clamp-2 max-w-[min(100%,7rem)] break-words text-center sm:max-w-[10rem]">
                              {name}
                            </span>
                            {i === dealerIndex && (
                              <SquareStack
                                size={18}
                                className="ml-0.5 -translate-y-px shrink-0 text-[var(--accent)] sm:h-5 sm:w-5"
                                aria-label="Mischer"
                              />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--vibe-line)]">
                    {rounds.map((round, ri) => {
                      const isLast = ri === rounds.length - 1;
                      const rowDealer = ri % playerCount;
                      return (
                        <tr
                          key={ri}
                          className={
                            isLast
                              ? "bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]"
                              : "hover:bg-[var(--vibe-bg-sunken)]/50 transition-colors"
                          }
                        >
                          <td className="sticky left-0 z-10 border-r border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-1 py-2.5 text-center text-[10px] font-semibold tabular-nums text-[var(--vibe-fg-muted)] sm:px-2 sm:text-xs">
                            <span className="tabular-nums text-[var(--vibe-fg-base)]">{ri + 1}</span>
                            <span className="sr-only">, Mischer: {gamePlayerNames[rowDealer]}</span>
                          </td>
                          {gamePlayerNames.map((_, pi) => {
                            const isWinner = round.winnerIndex === pi;
                            const val = round.scores[pi];

                            if (!isLast) {
                              const display =
                                round.winnerIndex === pi
                                  ? "trophy"
                                  : round.scores[pi] !== null
                                    ? round.scores[pi]
                                    : null;
                              return (
                                <td key={pi} className="min-w-0 px-1 py-2.5 text-center align-middle sm:px-2">
                                  <div className="flex min-h-10 items-center justify-center">
                                    {display === "trophy" ? (
                                      <WinnerTrophyDisplay interactive={false} />
                                    ) : (
                                      <span className="inline-block min-w-[2.25rem] text-center tabular-nums text-sm font-semibold text-[var(--vibe-fg-base)] sm:min-w-[2.5rem] sm:text-base">
                                        {display === null ? "–" : display}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            }

                            /* Letzte Runde: Phase 1 nur Trophy-Wahl; Phase 2 Eingaben + Trophy Gewinner */
                            if (round.winnerIndex === null) {
                              return (
                                <td key={pi} className="min-w-0 px-1 py-2 text-center align-middle sm:px-2">
                                  <div className="flex min-h-[4.5rem] items-center justify-center sm:min-h-24">
                                    <button
                                      type="button"
                                      onClick={() => setWinner(ri, pi)}
                                      className={cn(
                                        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--vibe-r-lg)]",
                                        "border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] text-[var(--vibe-fg-muted)]",
                                        "transition-colors hover:border-[var(--accent-line)] hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] hover:text-[var(--accent)]",
                                        ring,
                                      )}
                                      aria-label={`Als Gewinner wählen: ${gamePlayerNames[pi]}`}
                                    >
                                      <Trophy className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} aria-hidden />
                                    </button>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td key={pi} className="min-w-0 px-1 py-2 text-center align-middle sm:px-2">
                                <div className="flex min-h-[4.5rem] flex-col items-center justify-center gap-2 sm:min-h-24">
                                  {isWinner ? (
                                    <WinnerTrophyDisplay
                                      interactive
                                      onClick={() => setWinner(ri, pi)}
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      value={val ?? ""}
                                      onChange={(e) => setScore(ri, pi, e.target.value)}
                                      className={cn(
                                        "h-10 w-full max-w-[4.5rem] min-w-0 rounded-[var(--vibe-r-md)]",
                                        "border-2 border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)]",
                                        "px-1 text-center text-sm font-semibold tabular-nums",
                                        "focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/25",
                                        "sm:h-11 sm:max-w-[5rem] sm:text-base transition-colors",
                                      )}
                                      aria-label={`Punkte Runde ${ri + 1} ${gamePlayerNames[pi]}`}
                                    />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {isStarted && (
        <div className="shrink-0 border-t border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/95 px-3 pt-2 pb-[calc(max(0.5rem,env(safe-area-inset-bottom,0px))+64px)] backdrop-blur-md sm:px-4 md:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <div className="mx-auto w-full max-w-5xl sm:px-2">
            {totals.length > 0 && (
              <div className="mb-2 overflow-x-auto rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]">
                <table
                  style={narrowTableMinWidth ? { minWidth: narrowTableMinWidth } : undefined}
                  className={cn(rommeDisplay.className, "w-full border-collapse text-xs sm:text-sm")}
                >
                  <colgroup>
                    <col className="w-[2.75rem] min-w-[2.5rem] shrink-0" />
                    {gamePlayerNames.map((_, i) => (
                      <col
                        key={i}
                        style={
                          narrowPlayerColShare
                            ? { width: narrowPlayerColShare }
                            : isNarrow
                              ? { width: "25vw", minWidth: "4.25rem" }
                              : { width: colPct }
                        }
                      />
                    ))}
                  </colgroup>
                  <tbody>
                    <tr className="border-t-2 border-[var(--accent-line)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]">
                      <td className="sticky left-0 z-10 border-r border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-1 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-[var(--vibe-fg-faint)] sm:px-2 sm:text-[10px]">
                        Gesamt
                      </td>
                      {totals.map((t, i) => (
                        <td key={i} className="min-w-0 px-1 py-3 text-center sm:px-2">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {leaderIndices.has(i) && (
                              <Trophy
                                size={16}
                                className="shrink-0 text-[var(--accent)]"
                                aria-label="Führend"
                              />
                            )}
                            <span className="text-center text-base font-bold tabular-nums text-[var(--accent)] sm:text-lg">
                              {t}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <button
              type="button"
              onClick={addRound}
              disabled={!canAddRound}
              className={cn(
                "min-h-12 w-full rounded-[var(--vibe-r-lg)] border-2 py-3 text-sm font-bold uppercase tracking-wide transition-all sm:text-base",
                ring,
                canAddRound
                  ? "border-[var(--accent-line)] bg-[var(--vibe-bg-elevated)] text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] active:scale-[0.98]"
                  : "cursor-not-allowed border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] text-[var(--vibe-fg-faint)]",
              )}
            >
              Nächste Runde
            </button>
          </div>
        </div>
      )}
      </div>
    </ToolShell>
  );
}
