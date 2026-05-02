"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw, SquareStack, Trophy, UserPlus, X } from "lucide-react";
import { rommeDisplay } from "@/components/romme/romme-display-font";

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
  const tone = "text-red-800 dark:text-red-300";
  const icon = <Trophy className={`h-5 w-5 sm:h-6 sm:w-6 ${tone}`} strokeWidth={2} aria-hidden />;

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-red-900/35 bg-red-950/[0.06] transition-colors hover:border-red-800 hover:bg-red-950/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-red-800/50 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:focus-visible:ring-offset-zinc-950 ${tone}`}
        aria-label="Gewinner, erneut wählen"
      >
        {icon}
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${tone}`} aria-hidden>
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
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950";

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
    <div
      className={`${rommeDisplay.variable} flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
    >
      <header className="mx-auto flex w-full max-w-5xl shrink-0 items-end justify-between px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
        <div>
          <h1
            className={`${rommeDisplay.className} text-3xl font-bold uppercase tracking-tight text-red-900 underline decoration-red-300 decoration-4 underline-offset-4 dark:text-red-200 dark:decoration-red-900 sm:text-4xl md:text-5xl`}
          >
            Rommé
          </h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-zinc-500 sm:text-sm">
            Punkte
          </p>
        </div>
        {isStarted ? (
          <button
            type="button"
            onClick={resetAll}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-bold uppercase text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ${ring}`}
          >
            <RotateCcw size={14} aria-hidden />
            Reset
          </button>
        ) : null}
      </header>

      <main
        className={`mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 sm:px-6 ${isStarted ? "pb-28 sm:pb-32" : "pb-4"}`}
      >
        <AnimatePresence mode="wait">
          {!isStarted ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
              className="overflow-y-auto rounded-3xl border border-red-900/20 bg-white p-6 shadow-xl dark:border-red-950/50 dark:bg-zinc-900"
            >
              <h2 className="mb-4 text-center text-xl font-bold">Wer spielt mit?</h2>
              <div className="mb-6 grid gap-3">
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
                      className={`min-h-11 flex-1 rounded-xl border-none bg-zinc-100 p-3 dark:bg-zinc-800 ${ring}`}
                    />
                    {playerNames.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => setPlayerNames(playerNames.filter((_, idx) => idx !== i))}
                        className={`min-h-11 min-w-11 shrink-0 rounded-xl text-zinc-400 transition-colors hover:text-red-500 ${ring}`}
                        aria-label="Spieler entfernen"
                      >
                        <X size={18} aria-hidden className="mx-auto" />
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPlayerNames([...playerNames, ""])}
                  className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-red-800 transition-colors hover:text-red-950 dark:text-red-300 dark:hover:text-red-200 ${ring}`}
                >
                  <UserPlus size={16} aria-hidden />
                  Spieler hinzufügen
                </button>
              </div>
              <button
                type="button"
                onClick={initGame}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-900 py-4 font-black text-white shadow-lg shadow-red-900/25 transition-all hover:bg-red-950 active:scale-[0.98] dark:bg-red-800 dark:hover:bg-red-900 ${ring}`}
              >
                <Play size={18} aria-hidden />
                SPIEL STARTEN
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 shrink-0 overflow-x-auto rounded-2xl border border-red-900/20 bg-white shadow-xl dark:border-red-950/50 dark:bg-zinc-900">
                <table
                  style={narrowTableMinWidth ? { minWidth: narrowTableMinWidth } : undefined}
                  className={`${rommeDisplay.className} border-collapse text-xs sm:text-sm ${
                    narrowManyPlayersScroll ? "w-max min-w-full table-fixed" : "w-full min-w-0 table-fixed"
                  }`}
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
                  <thead>
                    <tr className="border-b border-zinc-200 bg-red-950/[0.06] dark:border-zinc-700 dark:bg-red-950/30">
                      <th
                        scope="col"
                        className="sticky left-0 z-20 border-r border-zinc-200 bg-red-50 px-1 py-3 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 sm:px-2 sm:text-[10px]"
                      >
                        #
                      </th>
                      {gamePlayerNames.map((name, i) => (
                        <th
                          key={i}
                          scope="col"
                          className="min-w-0 px-1 py-3 text-center align-middle text-[10px] font-semibold uppercase leading-tight tracking-wide text-zinc-800 dark:text-zinc-100 sm:px-2 sm:text-xs"
                        >
                          <span className="relative inline-flex items-center justify-center gap-0">
                            <span className="line-clamp-2 max-w-[min(100%,7rem)] break-words text-center sm:max-w-[10rem]">
                              {name}
                            </span>
                            {i === dealerIndex ? (
                              <SquareStack
                                size={18}
                                className="ml-0.5 -translate-y-px shrink-0 text-red-800 dark:text-red-300 sm:h-5 sm:w-5"
                                aria-label="Mischer"
                              />
                            ) : null}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {rounds.map((round, ri) => {
                      const isLast = ri === rounds.length - 1;
                      const rowDealer = ri % playerCount;
                      return (
                        <tr
                          key={ri}
                          className={
                            isLast
                              ? "bg-red-950/[0.04] dark:bg-red-950/20"
                              : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                          }
                        >
                          <td className="sticky left-0 z-10 border-r border-zinc-200 bg-white px-1 py-2.5 text-center text-[10px] font-semibold tabular-nums text-zinc-500 shadow-[2px_0_4px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-900 sm:px-2 sm:text-xs">
                            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">{ri + 1}</span>
                            <span className="sr-only">
                              , Mischer: {gamePlayerNames[rowDealer]}
                            </span>
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
                                      <span className="inline-block min-w-[2.25rem] text-center tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:min-w-[2.5rem] sm:text-base">
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
                                      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-red-800 transition-colors hover:border-red-400 hover:bg-red-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-red-300 dark:hover:border-red-700 dark:hover:bg-red-950/40 ${ring}`}
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
                                      className={`h-10 w-full max-w-[4.5rem] min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-1 text-center text-sm font-semibold tabular-nums dark:border-zinc-600 dark:bg-zinc-800 sm:h-11 sm:max-w-[5rem] sm:text-base ${ring}`}
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
                  <tfoot>
                    <tr className="border-t-2 border-red-900/25 bg-red-950/[0.08] dark:border-red-800/40 dark:bg-red-950/35">
                      <td className="sticky left-0 z-10 border-r border-zinc-200 bg-red-50 px-1 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-red-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-red-100 sm:px-2 sm:text-[10px]">
                        Gesamt
                      </td>
                      {totals.map((t, i) => (
                        <td key={i} className="min-w-0 px-1 py-3 text-center sm:px-2">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {leaderIndices.has(i) ? (
                              <Trophy
                                size={16}
                                className="shrink-0 text-amber-600 dark:text-amber-400"
                                aria-label="Führend"
                              />
                            ) : null}
                            <span className="text-center text-base font-bold tabular-nums text-red-950 dark:text-red-100 sm:text-lg">
                              {t}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {isStarted ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/90 bg-zinc-50/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="pointer-events-auto mx-auto w-full max-w-5xl sm:px-2">
            <button
              type="button"
              onClick={addRound}
              disabled={!canAddRound}
              className={`min-h-12 w-full rounded-2xl border-2 py-3 text-sm font-bold uppercase tracking-wide transition-all sm:text-base ${ring} ${
                canAddRound
                  ? "border-red-900/40 bg-white text-red-950 hover:border-red-900 hover:bg-red-50 active:scale-[0.98] dark:border-red-800/60 dark:bg-zinc-900 dark:text-red-100 dark:hover:bg-red-950/40"
                  : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
              }`}
            >
              Nächste Runde
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
