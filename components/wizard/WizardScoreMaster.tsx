"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconAlert, IconClose, IconMinus, IconPlus } from "@/components/ui/icons";

type Player = {
  name: string;
  totalScore: number;
  history: RoundResult[];
};

type RoundResult = {
  roundNumber: number;
  bid: number;
  actual: number;
  points: number;
};

type MainStage = "setup" | "game" | "finished";
type GamePhase = "mixer-announcement" | "bids" | "actuals" | "scoreboard";

type GameState = {
  mainStage: MainStage;
  gamePhase: GamePhase;
  players: Player[];
  totalRounds: number;
  roundNumber: number;
  mixerIndex: number;
  currentBidderIndex: number;
  currentActualIndex: number;
  pendingBids: number[];
  pendingActuals: number[];
};

const STORAGE_KEY = "wizard-pro-score-v3";

const MAX_NAME_LEN = 32;

function defaultPlayerNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Spieler ${i + 1}`);
}

const getRoundCount = (players: number) => Math.floor(60 / players);

const calculatePoints = (bid: number, actual: number) => {
  if (bid === actual) return 20 + actual * 10;
  return -Math.abs(bid - actual) * 10;
};

const getNextBidderIndex = (mixerIndex: number, playerCount: number) =>
  (mixerIndex + 1) % playerCount;

const getPlayerOrder = (startIndex: number, playerCount: number): number[] => {
  const order: number[] = [];
  for (let i = 0; i < playerCount; i++) {
    order.push((startIndex + i) % playerCount);
  }
  return order;
};

const INITIAL_STATE: GameState = {
  mainStage: "setup",
  gamePhase: "mixer-announcement",
  players: [],
  totalRounds: 0,
  roundNumber: 1,
  mixerIndex: 0,
  currentBidderIndex: 0,
  currentActualIndex: 0,
  pendingBids: [],
  pendingActuals: [],
};

/**
 * Flex column (not `absolute`) so parents keep a real height on mobile — absolute-only roots
 * collapsed to 0px and showed only the dark gradient. `min-h` backs up the flex chain (svh/mobile).
 */
const shell =
  "relative z-0 flex w-full min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden font-sans selection:bg-amber-500/25 " +
  "min-h-[calc(100svh-3.5rem)] md:min-h-0 " +
  "bg-gradient-to-b from-amber-50 via-stone-100 to-amber-100/95 text-amber-950 " +
  "dark:from-[#080d18] dark:via-[#0f172a] dark:to-[#020617] dark:text-amber-50";

const card =
  "rounded-[2rem] border backdrop-blur-xl shadow-xl " +
  "border-amber-200/60 bg-white/75 shadow-amber-900/5 " +
  "dark:border-amber-900/35 dark:bg-slate-900/45 dark:shadow-black/40";

const glow =
  "pointer-events-none absolute inset-0 opacity-80 dark:opacity-100 " +
  "bg-[radial-gradient(ellipse_100%_70%_at_50%_-25%,#fde68a,transparent)] " +
  "dark:bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)]";

const primaryBtn =
  "w-full rounded-2xl bg-amber-500 py-4 text-sm font-black uppercase tracking-widest text-slate-950 shadow-lg " +
  "transition-colors hover:bg-amber-400 active:bg-amber-600 dark:text-slate-950 dark:hover:bg-amber-400 " +
  "touch-manipulation";

const stepperBtn =
  "flex h-16 flex-1 items-center justify-center rounded-xl border-2 border-amber-500 bg-white/90 text-amber-700 " +
  "transition-colors hover:bg-amber-50 active:bg-amber-100 dark:border-amber-400 dark:bg-slate-900/80 dark:text-amber-300 " +
  "dark:hover:bg-slate-800 md:h-16 md:w-16 md:flex-none touch-manipulation";

function BigNumber({ value }: { value: number }) {
  return (
    <div
      className={
        "flex min-h-[5rem] min-w-[6rem] items-center justify-center rounded-2xl border-4 border-amber-500 " +
        "bg-amber-50 text-5xl font-serif font-bold tabular-nums text-amber-900 shadow-inner shadow-amber-900/10 " +
        "dark:border-amber-400 dark:bg-slate-950 dark:text-amber-200 md:min-h-[5.5rem] md:min-w-[8rem] md:text-6xl"
      }
      aria-live="polite"
      aria-label={`Wert ${value}`}
    >
      {value}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className={
        "flex items-start justify-center gap-2 rounded-2xl border border-red-300/80 bg-red-50/95 p-3 text-center " +
        "text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-100"
      }
      role="alert"
    >
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
      <span>{message}</span>
    </div>
  );
}

function CloseGameButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border " +
        "border-amber-200/80 bg-white/90 text-zinc-500 transition-colors hover:border-red-300 hover:text-red-600 " +
        "dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-red-500/50 dark:hover:text-red-400 md:right-4 md:top-4"
      }
      aria-label="Spiel beenden"
    >
      <IconClose className="h-5 w-5" />
    </button>
  );
}

export default function WizardScoreMaster() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [setupPlayerCount, setSetupPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>(() =>
    defaultPlayerNames(4),
  );
  const [error, setError] = useState<string | null>(null);
  const isHydrated = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        const ok =
          parsed &&
          typeof parsed === "object" &&
          "mainStage" in parsed &&
          "players" in parsed &&
          Array.isArray((parsed as GameState).players) &&
          Array.isArray((parsed as GameState).pendingBids) &&
          Array.isArray((parsed as GameState).pendingActuals);
        const gs = ok ? (parsed as GameState) : null;
        const n = gs?.players.length ?? 0;
        const inProgress =
          gs?.mainStage === "game" || gs?.mainStage === "finished";
        const lengthsMatch =
          gs &&
          gs.pendingBids.length === n &&
          gs.pendingActuals.length === n;
        const playerCountOk = !inProgress || (n >= 3 && n <= 6);
        const valid =
          gs &&
          lengthsMatch &&
          playerCountOk &&
          (!inProgress ||
            (Number.isFinite(gs.roundNumber) &&
              Number.isFinite(gs.totalRounds) &&
              gs.mixerIndex >= 0 &&
              gs.mixerIndex < n &&
              gs.currentBidderIndex >= 0 &&
              gs.currentBidderIndex < n &&
              gs.currentActualIndex >= 0 &&
              gs.currentActualIndex < n));

        queueMicrotask(() => {
          if (valid) {
            setState(gs);
          } else {
            localStorage.removeItem(STORAGE_KEY);
            setState(INITIAL_STATE);
          }
          isHydrated.current = true;
        });
      } catch (e) {
        console.error("Fehler beim Laden des Spielstands", e);
        localStorage.removeItem(STORAGE_KEY);
        isHydrated.current = true;
      }
    } else {
      isHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (isHydrated.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const leaderboard = useMemo(
    () => [...state.players].sort((a, b) => b.totalScore - a.totalScore),
    [state.players],
  );

  const currentMixer = state.players[state.mixerIndex];
  const bidderOrder = getPlayerOrder(
    getNextBidderIndex(state.mixerIndex, state.players.length),
    state.players.length,
  );
  const currentBidderIndex = bidderOrder[state.currentBidderIndex];
  const currentBidder = state.players[currentBidderIndex];

  const actualOrder = getPlayerOrder(0, state.players.length);
  const currentActualBidderIndex = actualOrder[state.currentActualIndex];
  const currentActualBidder = state.players[currentActualBidderIndex];

  const handleStartGame = useCallback(() => {
    setError(null);
    const playerCount = setupPlayerCount;
    const names = playerNames.slice(0, playerCount).map((s) => s.trim());
    if (names.some((n) => n.length === 0)) {
      setError("Bitte für jeden Spieler einen Namen eintragen.");
      return;
    }
    const lower = names.map((n) => n.toLowerCase());
    if (new Set(lower).size !== names.length) {
      setError("Die Namen müssen sich unterscheiden.");
      return;
    }

    const randomMixer = Math.floor(Math.random() * playerCount);
    const roundCount = getRoundCount(playerCount);

    setState({
      mainStage: "game",
      gamePhase: "mixer-announcement",
      players: names.map((name) => ({ name, totalScore: 0, history: [] })),
      totalRounds: roundCount,
      roundNumber: 1,
      mixerIndex: randomMixer,
      currentBidderIndex: 0,
      currentActualIndex: 0,
      pendingBids: new Array(playerCount).fill(0),
      pendingActuals: new Array(playerCount).fill(0),
    });
  }, [setupPlayerCount, playerNames]);

  const handleBidSubmit = useCallback(() => {
    setError(null);

    const isLastBidder =
      state.currentBidderIndex === state.players.length - 1;

    if (isLastBidder) {
      const sumBids = state.pendingBids.reduce((a, b) => a + b, 0);
      if (sumBids === state.roundNumber) {
        setError(
          `Die Summe der Ansagen darf nicht ${state.roundNumber} sein.`,
        );
        return;
      }
      setState((prev) => ({
        ...prev,
        gamePhase: "actuals",
        currentActualIndex: 0,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        currentBidderIndex: prev.currentBidderIndex + 1,
      }));
    }
  }, [
    state.currentBidderIndex,
    state.players.length,
    state.pendingBids,
    state.roundNumber,
  ]);

  const handleActualSubmit = useCallback(() => {
    setError(null);

    const isLastActual =
      state.currentActualIndex === state.players.length - 1;

    if (isLastActual) {
      const sumActuals = state.pendingActuals.reduce((a, b) => a + b, 0);
      if (sumActuals !== state.roundNumber) {
        setError(
          `Die Summe der Stiche muss genau ${state.roundNumber} sein. Derzeit: ${sumActuals}.`,
        );
        return;
      }

      const updatedPlayers = state.players.map((p, i) => {
        const points = calculatePoints(
          state.pendingBids[i],
          state.pendingActuals[i],
        );
        return {
          ...p,
          totalScore: p.totalScore + points,
          history: [
            ...p.history,
            {
              roundNumber: state.roundNumber,
              bid: state.pendingBids[i],
              actual: state.pendingActuals[i],
              points,
            },
          ],
        };
      });

      setState((prev) => ({
        ...prev,
        players: updatedPlayers,
        gamePhase: "scoreboard",
      }));
    } else {
      setState((prev) => ({
        ...prev,
        currentActualIndex: prev.currentActualIndex + 1,
      }));
    }
  }, [
    state.currentActualIndex,
    state.players,
    state.pendingActuals,
    state.pendingBids,
    state.roundNumber,
  ]);

  const handleNextRound = useCallback(() => {
    setError(null);

    const isFinished = state.roundNumber >= state.totalRounds;

    if (isFinished) {
      setState((prev) => ({
        ...prev,
        mainStage: "finished",
      }));
    } else {
      const nextRound = state.roundNumber + 1;
      const nextMixerIndex = (state.mixerIndex + 1) % state.players.length;

      setState((prev) => ({
        ...prev,
        roundNumber: nextRound,
        mixerIndex: nextMixerIndex,
        gamePhase: "mixer-announcement",
        currentBidderIndex: 0,
        currentActualIndex: 0,
        pendingBids: new Array(prev.players.length).fill(0),
        pendingActuals: new Array(prev.players.length).fill(0),
      }));
    }
  }, [
    state.roundNumber,
    state.totalRounds,
    state.mixerIndex,
    state.players.length,
  ]);

  const resetGame = useCallback(() => {
    if (confirm("Möchtest du das aktuelle Spiel wirklich beenden?")) {
      localStorage.removeItem(STORAGE_KEY);
      setState(INITIAL_STATE);
      setPlayerNames(defaultPlayerNames(setupPlayerCount));
    }
  }, [setupPlayerCount]);

  const titleClass =
    "font-serif text-3xl font-bold tracking-tighter text-transparent sm:text-4xl md:text-5xl " +
    "bg-gradient-to-b from-amber-700 to-amber-500 bg-clip-text " +
    "dark:from-amber-200 dark:to-amber-500";

  const labelMuted =
    "text-[10px] font-black uppercase tracking-widest text-amber-700/70 sm:text-xs dark:text-amber-400/70";

  return (
    <div className={shell}>
      <div className={glow} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {state.mainStage === "setup" && (
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 sm:p-4">
            <div
              className={`${card} mx-auto w-full max-w-md space-y-4 p-4 sm:space-y-6 sm:p-6`}
            >
              <div className="space-y-1 text-center sm:space-y-2">
                <h1 className={titleClass}>WIZARD</h1>
                <p className={labelMuted}>Score Master Pro</p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="block text-center">
                    <span className={labelMuted}>Anzahl der Spieler</span>
                    <div className="mx-auto mt-2 grid w-full max-w-[18rem] grid-cols-4 gap-2 sm:mt-3 sm:max-w-xs sm:gap-3">
                      {[3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setSetupPlayerCount(n);
                            setPlayerNames((prev) =>
                              Array.from({ length: n }, (_, i) =>
                                prev[i] !== undefined ? prev[i] : `Spieler ${i + 1}`,
                              ),
                            );
                            setError(null);
                          }}
                          className={
                            `flex aspect-square w-full max-h-14 shrink-0 items-center justify-center rounded-full border-2 font-serif text-base transition-colors sm:max-h-16 sm:text-lg touch-manipulation ` +
                            (setupPlayerCount === n
                              ? "border-amber-400 bg-amber-500 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.35)] dark:border-amber-300 dark:bg-amber-400"
                              : "border-amber-300/60 bg-white/60 text-amber-800 hover:bg-amber-100/80 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800")
                          }
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className={`${labelMuted} block text-center`}>
                      Namen der Spieler
                    </span>
                    {Array.from({ length: setupPlayerCount }).map((_, i) => (
                      <label key={i} className="block">
                        <span
                          className={`${labelMuted} mb-1.5 block text-left text-[10px] sm:text-xs`}
                        >
                          Spieler {i + 1}
                        </span>
                        <input
                          type="text"
                          value={playerNames[i] ?? ""}
                          onChange={(e) => {
                            const v = e.target.value.slice(0, MAX_NAME_LEN);
                            setPlayerNames((prev) => {
                              const next = [...prev];
                              next[i] = v;
                              return next;
                            });
                            setError(null);
                          }}
                          className={
                            "w-full rounded-2xl border border-amber-200/80 bg-white/90 px-4 py-3 text-base text-amber-950 shadow-inner outline-none " +
                            "ring-0 placeholder:text-amber-900/35 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/35 " +
                            "dark:border-slate-600 dark:bg-slate-900/85 dark:text-amber-50 dark:placeholder:text-slate-500 dark:focus:border-amber-500 dark:focus:ring-amber-500/25"
                          }
                          placeholder={`Name eingeben …`}
                          autoComplete="off"
                          autoCapitalize="words"
                          enterKeyHint="done"
                          inputMode="text"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {error ? <ErrorBanner message={error} /> : null}

                <button
                  type="button"
                  onClick={handleStartGame}
                  className={primaryBtn}
                >
                  Spiel beginnen
                </button>
              </div>
            </div>
          </div>
        )}

        {state.mainStage === "game" && (
          <div className="flex min-h-0 w-full flex-1 flex-col">
            {state.gamePhase === "mixer-announcement" && (
              <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-3 sm:p-4">
                <CloseGameButton onClick={resetGame} />
                <div className="w-full max-w-md space-y-3 text-center sm:space-y-6 app-page-enter">
                  <div className="space-y-2 sm:space-y-3">
                    <p className={labelMuted}>
                      Runde {state.roundNumber} von {state.totalRounds}
                    </p>
                    <div className="relative inline-block w-full">
                      <div className="absolute inset-0 mx-auto bg-amber-400 opacity-25 blur-3xl motion-safe:animate-pulse dark:bg-amber-500 dark:opacity-20" />
                      <div className="relative space-y-2 p-4 sm:space-y-4 sm:p-8">
                        <p className="break-words font-serif text-3xl font-black leading-tight text-amber-900 sm:text-5xl md:text-6xl dark:text-amber-100">
                          {currentMixer?.name}
                        </p>
                        <p className="text-lg font-bold text-amber-700 sm:text-xl md:text-2xl dark:text-amber-400">
                          ist der Mischer
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      "space-y-2 rounded-2xl border border-amber-200/60 bg-white/50 p-3 sm:space-y-3 sm:p-6 md:rounded-3xl " +
                      "dark:border-amber-900/30 dark:bg-slate-900/40"
                    }
                  >
                    <p className="text-sm font-bold text-amber-950 sm:text-lg dark:text-amber-50">
                      Bitte teile {state.roundNumber} Karten an jeden aus.
                    </p>
                    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                      {state.players.map((p, i) => (
                        <div
                          key={i}
                          className={
                            `min-h-[2.5rem] min-w-0 break-words rounded-lg px-2 py-2 text-center text-xs font-bold leading-snug sm:text-sm ` +
                            (i === state.mixerIndex
                              ? "bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950"
                              : "bg-white/80 text-amber-900 dark:bg-slate-800 dark:text-slate-200")
                          }
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        gamePhase: "bids",
                        currentBidderIndex: 0,
                      }))
                    }
                    className={primaryBtn}
                  >
                    Karten verteilt
                  </button>
                </div>
              </div>
            )}

            {state.gamePhase === "bids" && (
              <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-2 sm:p-4">
                <CloseGameButton onClick={resetGame} />
                <div className="w-full max-w-md space-y-3 text-center sm:space-y-6 app-page-enter">
                  <div className="space-y-1">
                    <p className={labelMuted}>
                      Runde {state.roundNumber} – Ansagen
                    </p>
                    <p className="text-xs text-amber-800 sm:text-sm dark:text-amber-300">
                      {state.currentBidderIndex + 1} von {state.players.length}
                    </p>
                  </div>

                  <div className="relative inline-block w-full">
                    <div className="absolute inset-0 mx-auto bg-amber-400 opacity-25 blur-3xl motion-safe:animate-pulse dark:bg-amber-500 dark:opacity-20" />
                    <div className="relative space-y-2 p-3 sm:space-y-4 sm:p-8">
                      <p className="break-words font-serif text-3xl font-black leading-tight text-amber-900 sm:text-5xl md:text-6xl dark:text-amber-100">
                        {currentBidder?.name}
                      </p>
                      <p className="text-base font-bold text-amber-700 sm:text-xl dark:text-amber-400">
                        Wie viele Stiche?
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col items-center gap-4">
                    <div className="flex w-full items-center gap-3 md:gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...state.pendingBids];
                          next[currentBidderIndex] = Math.max(
                            0,
                            next[currentBidderIndex] - 1,
                          );
                          setState((s) => ({ ...s, pendingBids: next }));
                        }}
                        className={stepperBtn}
                        aria-label="Eins weniger"
                      >
                        <IconMinus className="h-8 w-8" />
                      </button>
                      <div className="flex flex-1 justify-center">
                        <BigNumber
                          value={state.pendingBids[currentBidderIndex]}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...state.pendingBids];
                          next[currentBidderIndex] = Math.min(
                            state.roundNumber,
                            next[currentBidderIndex] + 1,
                          );
                          setState((s) => ({ ...s, pendingBids: next }));
                        }}
                        className={stepperBtn}
                        aria-label="Eins mehr"
                      >
                        <IconPlus className="h-8 w-8" />
                      </button>
                    </div>
                  </div>

                  {error ? <ErrorBanner message={error} /> : null}

                  <button
                    type="button"
                    onClick={handleBidSubmit}
                    className={primaryBtn}
                  >
                    {state.currentBidderIndex === state.players.length - 1
                      ? "Bestätigen und weiter"
                      : "Bestätigen"}
                  </button>
                </div>
              </div>
            )}

            {state.gamePhase === "actuals" && (
              <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-2 sm:p-4">
                <CloseGameButton onClick={resetGame} />
                <div className="w-full max-w-md space-y-3 text-center sm:space-y-6 app-page-enter">
                  <div className="space-y-1">
                    <p className={labelMuted}>
                      Runde {state.roundNumber} – Abrechnung
                    </p>
                    <p className="text-xs text-amber-800 sm:text-sm dark:text-amber-300">
                      {state.currentActualIndex + 1} von {state.players.length}
                    </p>
                  </div>

                  <div className="relative inline-block w-full">
                    <div className="absolute inset-0 mx-auto bg-amber-400 opacity-25 blur-3xl motion-safe:animate-pulse dark:bg-amber-500 dark:opacity-20" />
                    <div className="relative space-y-1 p-3 sm:space-y-4 sm:p-8">
                      <p className="break-words font-serif text-3xl font-black leading-tight text-amber-900 sm:text-5xl md:text-6xl dark:text-amber-100">
                        {currentActualBidder?.name}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm text-amber-800 sm:text-lg dark:text-amber-300">
                          Ansage: {state.pendingBids[currentActualBidderIndex]}
                        </p>
                        <p className="text-base font-bold text-amber-950 sm:text-xl dark:text-amber-50">
                          Stiche gemacht?
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col items-center gap-4">
                    <div className="flex w-full items-center gap-3 md:gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...state.pendingActuals];
                          next[currentActualBidderIndex] = Math.max(
                            0,
                            next[currentActualBidderIndex] - 1,
                          );
                          setState((s) => ({ ...s, pendingActuals: next }));
                        }}
                        className={stepperBtn}
                        aria-label="Eins weniger"
                      >
                        <IconMinus className="h-8 w-8" />
                      </button>
                      <div className="flex flex-1 justify-center">
                        <BigNumber
                          value={
                            state.pendingActuals[currentActualBidderIndex]
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...state.pendingActuals];
                          next[currentActualBidderIndex] = Math.min(
                            state.roundNumber,
                            next[currentActualBidderIndex] + 1,
                          );
                          setState((s) => ({ ...s, pendingActuals: next }));
                        }}
                        className={stepperBtn}
                        aria-label="Eins mehr"
                      >
                        <IconPlus className="h-8 w-8" />
                      </button>
                    </div>
                  </div>

                  {error ? <ErrorBanner message={error} /> : null}

                  <button
                    type="button"
                    onClick={handleActualSubmit}
                    className={primaryBtn}
                  >
                    {state.currentActualIndex === state.players.length - 1
                      ? "Bestätigen und Abrechnung"
                      : "Bestätigen"}
                  </button>
                </div>
              </div>
            )}

            {state.gamePhase === "scoreboard" && (
              <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain p-2 pb-16 sm:p-4">
                <CloseGameButton onClick={resetGame} />
                <div className="mx-auto w-full max-w-md space-y-3 sm:space-y-4">
                  <div className="py-2 text-center sm:py-3 app-page-enter">
                    <p className={`${labelMuted} mb-1`}>
                      Runde {state.roundNumber} abgeschlossen
                    </p>
                    <h2 className="font-serif text-xl font-bold text-amber-800 sm:text-2xl md:text-3xl dark:text-amber-200">
                      Punktetabelle
                    </h2>
                  </div>

                  <div
                    className={
                      "overflow-hidden rounded-2xl border border-amber-200/50 bg-white/50 dark:border-slate-800/60 dark:bg-slate-900/35 app-page-enter"
                    }
                  >
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-amber-100/80 text-[8px] font-bold uppercase text-amber-800 sm:text-[9px] md:text-[10px] dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                          <th className="px-2 py-2 sm:px-6 sm:py-3">#</th>
                          <th className="px-1 py-2 sm:px-2 sm:py-3">Spieler</th>
                          <th className="px-2 py-2 text-right sm:px-6 sm:py-3">
                            Pkt.
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100/80 dark:divide-slate-800/50">
                        {leaderboard.map((p, i) => (
                          <tr
                            key={`sb-${i}-${p.name}`}
                            className={
                              i === 0
                                ? "bg-amber-400/10 dark:bg-amber-500/[0.06]"
                                : ""
                            }
                          >
                            <td className="px-2 py-2 sm:px-6">
                              <div
                                className={
                                  `flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold sm:h-5 sm:w-5 sm:text-[8px] md:h-6 md:w-6 md:text-[10px] ` +
                                  (i === 0
                                    ? "bg-amber-500 text-slate-950 dark:bg-amber-400"
                                    : "bg-amber-200/80 text-amber-900 dark:bg-slate-800 dark:text-slate-400")
                                }
                              >
                                {i + 1}
                              </div>
                            </td>
                            <td className="truncate px-1 py-1 text-xs font-bold text-amber-950 sm:px-2 sm:py-2 sm:text-sm dark:text-amber-100/90">
                              {p.name}
                            </td>
                            <td className="px-2 py-1 text-right font-serif text-xs font-bold text-amber-700 sm:px-6 sm:py-2 sm:text-sm dark:text-amber-400">
                              {p.totalScore}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className={
                      "space-y-2 rounded-2xl border border-amber-200/50 bg-white/50 p-2 sm:p-4 dark:border-slate-800/60 dark:bg-slate-900/35"
                    }
                  >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 sm:text-sm dark:text-amber-400">
                      Diese Runde
                    </h3>
                    <div className="grid gap-1 sm:gap-2">
                      {state.players.map((p, i) => {
                        const roundData = p.history[p.history.length - 1];
                        return (
                          <div
                            key={i}
                            className={
                              "flex items-center justify-between gap-1 rounded-lg border border-amber-100/80 bg-amber-50/50 p-2 text-xs sm:gap-2 sm:text-sm " +
                              "dark:border-slate-800 dark:bg-slate-950/30"
                            }
                          >
                            <span className="truncate font-bold text-amber-950 dark:text-amber-50">
                              {p.name}
                            </span>
                            <span className="whitespace-nowrap text-amber-800 dark:text-slate-400">
                              {roundData?.bid} / {roundData?.actual}
                            </span>
                            <span
                              className={
                                `whitespace-nowrap font-serif text-xs font-bold sm:text-sm ` +
                                (roundData && roundData.points >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400")
                              }
                            >
                              {roundData && roundData.points >= 0
                                ? `+${roundData.points}`
                                : String(roundData?.points ?? "")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextRound}
                    className={
                      "w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-400 py-4 text-base font-black uppercase tracking-widest text-slate-950 shadow-xl " +
                      "transition-all hover:from-amber-500 hover:to-amber-300 active:from-amber-700 active:to-amber-500 touch-manipulation app-page-enter"
                    }
                  >
                    {state.roundNumber >= state.totalRounds
                      ? "Spiel beenden"
                      : "Nächste Runde"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {state.mainStage === "finished" && (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center p-2 sm:p-4">
            <div className="max-h-screen w-full max-w-md space-y-3 overflow-y-auto text-center sm:space-y-6 app-page-enter">
              <div className="space-y-1 sm:space-y-2">
                <h2 className="font-serif text-xl font-bold text-amber-800 sm:text-2xl md:text-3xl dark:text-amber-200">
                  Das Schicksal ist besiegelt!
                </h2>
                <p className="text-xs text-amber-800/90 sm:text-sm dark:text-slate-400">
                  Der mächtigste Magier ist...
                </p>
              </div>

              <div className="relative inline-block w-full">
                <div className="absolute inset-0 mx-auto bg-amber-400 opacity-25 blur-3xl motion-safe:animate-pulse dark:bg-amber-500 dark:opacity-20" />
                <div
                  className={
                    "relative rounded-2xl border-2 border-amber-400/80 bg-white/70 p-4 shadow-2xl sm:p-8 md:rounded-[2.5rem] " +
                    "dark:border-amber-500/50 dark:bg-slate-900/70"
                  }
                >
                  <p className="mb-1 break-words font-serif text-3xl font-black text-amber-700 sm:mb-2 sm:text-4xl md:text-5xl dark:text-amber-300">
                    {leaderboard[0]?.name ?? "–"}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-700/80 sm:text-sm dark:text-amber-500/80">
                    {leaderboard[0]?.totalScore ?? 0} Punkte
                  </p>
                </div>
              </div>

              <div
                className={
                  "overflow-hidden rounded-2xl border border-amber-200/50 bg-white/50 dark:border-slate-800/60 dark:bg-slate-900/35"
                }
              >
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-amber-100/80 text-[8px] font-bold uppercase text-amber-800 sm:text-[9px] md:text-[10px] dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th className="px-2 py-2 sm:px-6 sm:py-3">#</th>
                      <th className="px-1 py-2 sm:px-2 sm:py-3">Spieler</th>
                      <th className="px-2 py-2 text-right sm:px-6 sm:py-3">
                        Pkt.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/80 dark:divide-slate-800/50">
                    {leaderboard.map((p, i) => (
                      <tr
                        key={`fin-${i}-${p.name}`}
                        className={
                          i === 0
                            ? "bg-amber-400/10 dark:bg-amber-500/[0.06]"
                            : ""
                        }
                      >
                        <td className="px-2 py-2 sm:px-6">
                          <div
                            className={
                              `flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold sm:h-5 sm:w-5 sm:text-[8px] md:h-6 md:w-6 md:text-[10px] ` +
                              (i === 0
                                ? "bg-amber-500 text-slate-950 dark:bg-amber-400"
                                : "bg-amber-200/80 text-amber-900 dark:bg-slate-800 dark:text-slate-400")
                            }
                          >
                            {i + 1}
                          </div>
                        </td>
                        <td className="truncate px-1 py-1 text-xs font-bold text-amber-950 sm:px-2 sm:py-2 sm:text-sm dark:text-amber-100/90">
                          {p.name}
                        </td>
                        <td className="px-2 py-1 text-right font-serif text-xs font-bold text-amber-700 sm:px-6 sm:py-2 sm:text-sm dark:text-amber-400">
                          {p.totalScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={resetGame}
                className={
                  "w-full py-4 text-sm font-black uppercase tracking-[0.2em] text-amber-700 transition-colors hover:text-amber-900 " +
                  "active:text-amber-600 dark:text-amber-400 dark:hover:text-amber-200 touch-manipulation"
                }
              >
                Ein neues Zeitalter beginnen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
