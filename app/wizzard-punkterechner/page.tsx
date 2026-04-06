"use client";

import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";

// --- Typdefinitionen ---
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

const STORAGE_KEY = "wizard-pro-score-v2";

// --- Hilfsfunktionen ---
const getRoundCount = (players: number) => Math.floor(60 / players);

const calculatePoints = (bid: number, actual: number) => {
  if (bid === actual) {
    return 20 + actual * 10;
  }
  return -Math.abs(bid - actual) * 10;
};

const getNextBidderIndex = (mixerIndex: number, playerCount: number) => {
  return (mixerIndex + 1) % playerCount;
};

const getPlayerOrder = (
  startIndex: number,
  playerCount: number
): number[] => {
  const order = [];
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

export default function WizardScoreMaster() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [setupPlayerCount, setSetupPlayerCount] = useState(4);
  const [setupNames, setSetupNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isHydrated = useRef(false);

  // --- Persistence Logic ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Fehler beim Laden des Spielstands", e);
      }
    }
    isHydrated.current = true;
  }, []);

  useEffect(() => {
    if (isHydrated.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const leaderboard = useMemo(() => {
    return [...state.players].sort((a, b) => b.totalScore - a.totalScore);
  }, [state.players]);

  const currentMixer = state.players[state.mixerIndex];
  const bidderOrder = getPlayerOrder(
    getNextBidderIndex(state.mixerIndex, state.players.length),
    state.players.length
  );
  const currentBidderIndex =
    bidderOrder[state.currentBidderIndex];
  const currentBidder = state.players[currentBidderIndex];

  const actualOrder = getPlayerOrder(0, state.players.length);
  const currentActualBidderIndex = actualOrder[state.currentActualIndex];
  const currentActualBidder = state.players[currentActualBidderIndex];

  // --- Handlers ---
  const handleStartGame = useCallback(() => {
    setError(null);
    const playerCount = setupPlayerCount;
    const names = Array.from({ length: playerCount }).map((_, i) => {
      const name = setupNames[i]?.trim();
      return name || `Spieler ${i + 1}`;
    });

    const randomMixer = Math.floor(Math.random() * playerCount);
    const roundCount = getRoundCount(playerCount);

    setState({
      mainStage: "game",
      gamePhase: "mixer-announcement",
      players: names.map(name => ({ name, totalScore: 0, history: [] })),
      totalRounds: roundCount,
      roundNumber: 1,
      mixerIndex: randomMixer,
      currentBidderIndex: 0,
      currentActualIndex: 0,
      pendingBids: new Array(playerCount).fill(0),
      pendingActuals: new Array(playerCount).fill(0),
    });
  }, [setupPlayerCount, setupNames]);

  const handleBidSubmit = useCallback(() => {
    setError(null);

    const isLastBidder =
      state.currentBidderIndex === state.players.length - 1;

    if (isLastBidder) {
      const sumBids = state.pendingBids.reduce((a, b) => a + b, 0);
      if (sumBids === state.roundNumber) {
        setError(
          `Die Summe der Ansagen darf nicht ${state.roundNumber} sein!`
        );
        return;
      }
      setState(prev => ({
        ...prev,
        gamePhase: "actuals",
        currentActualIndex: 0,
      }));
    } else {
      setState(prev => ({
        ...prev,
        currentBidderIndex: prev.currentBidderIndex + 1,
      }));
    }
  }, [state.currentBidderIndex, state.players.length, state.pendingBids, state.roundNumber]);

  const handleActualSubmit = useCallback(() => {
    setError(null);

    const isLastActual =
      state.currentActualIndex === state.players.length - 1;

    if (isLastActual) {
      const sumActuals = state.pendingActuals.reduce((a, b) => a + b, 0);
      if (sumActuals !== state.roundNumber) {
        setError(
          `Die Summe der Stiche muss genau ${state.roundNumber} sein! (Derzeit: ${sumActuals})`
        );
        return;
      }

      const updatedPlayers = state.players.map((p, i) => {
        const points = calculatePoints(state.pendingBids[i], state.pendingActuals[i]);
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

      setState(prev => ({
        ...prev,
        players: updatedPlayers,
        gamePhase: "scoreboard",
      }));
    } else {
      setState(prev => ({
        ...prev,
        currentActualIndex: prev.currentActualIndex + 1,
      }));
    }
  }, [state.currentActualIndex, state.players.length, state.pendingActuals, state.pendingBids, state.roundNumber]);

  const handleNextRound = useCallback(() => {
    setError(null);

    const isFinished = state.roundNumber >= state.totalRounds;

    if (isFinished) {
      setState(prev => ({
        ...prev,
        mainStage: "finished",
      }));
    } else {
      const nextRound = state.roundNumber + 1;
      const nextMixerIndex = (state.mixerIndex + 1) % state.players.length;

      setState(prev => ({
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
  }, [state.roundNumber, state.totalRounds, state.mixerIndex, state.players.length]);

  const resetGame = useCallback(() => {
    if (
      confirm(
        "Möchtest du das aktuelle Spiel wirklich beenden?"
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      setState(INITIAL_STATE);
      setSetupNames([]);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-[#020617] text-amber-50 font-sans selection:bg-amber-500/30 overflow-hidden">
      {/* Mystischer Hintergrund-Effekt */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] pointer-events-none" />

      <div className="relative w-full h-full">
        
        {/* --- SETUP STAGE --- */}
        {state.mainStage === "setup" && (
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-md space-y-4 sm:space-y-6 bg-slate-900/40 border border-amber-900/20 p-4 sm:p-6 rounded-[2rem] backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="text-center space-y-1 sm:space-y-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
                  WIZARD
                </h1>
                <p className="text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-amber-500/60 font-bold">
                  Score Master Pro
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <label className="block text-center">
                    <span className="text-[10px] sm:text-xs uppercase text-amber-500/60 font-black tracking-widest">
                      Anzahl der Spieler
                    </span>
                    <div className="flex justify-center gap-2 mt-2 sm:mt-3">
                      {[3, 4, 5, 6].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSetupPlayerCount(n)}
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 transition-all font-serif text-base sm:text-lg touch-manipulation ${
                            setupPlayerCount === n
                              ? "bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-100"
                              : "bg-slate-800/50 border-slate-700 text-slate-400"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </label>

                  <div className="space-y-2">
                    <span className="text-[10px] sm:text-xs uppercase text-amber-500/60 font-black tracking-widest block text-center mb-2">
                      Namen der Spieler
                    </span>
                    {Array.from({ length: setupPlayerCount }).map((_, i) => (
                      <input
                        key={i}
                        type="text"
                        value={setupNames[i] || ""}
                        onChange={(e) => {
                          const newNames = [...setupNames];
                          newNames[i] = e.target.value;
                          setSetupNames(newNames);
                        }}
                        placeholder={`Spieler ${i + 1}`}
                        className="w-full bg-slate-800/30 border-2 border-slate-700/50 rounded-2xl px-3 py-2 sm:py-3 text-sm font-normal text-center placeholder:text-slate-600 transition-all focus:border-amber-500/50 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.1)] touch-manipulation"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartGame}
                  className="w-full bg-amber-500 text-slate-950 font-black py-4 rounded-2xl shadow-lg active:bg-amber-600 transition-colors uppercase tracking-widest text-base touch-manipulation"
                >
                  Spiel beginnen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- GAME STAGE --- */}
        {state.mainStage === "game" && (
          <div className="w-full h-full flex flex-col">
            {/* --- MIXER ANNOUNCEMENT --- */}
            {state.gamePhase === "mixer-announcement" && (
              <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4">
                <div className="text-center space-y-3 sm:space-y-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-amber-500/60 uppercase tracking-widest text-xs sm:text-sm font-bold">
                      Runde {state.roundNumber} von {state.totalRounds}
                    </p>
                    <div className="relative inline-block w-full">
                      <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse mx-auto" />
                      <div className="relative space-y-2 sm:space-y-4 p-4 sm:p-8">
                        <p className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-amber-200 leading-tight break-words">
                          {currentMixer?.name}
                        </p>
                        <p className="text-lg sm:text-xl md:text-2xl text-amber-400 font-bold">
                          ist der Mischer
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-amber-900/20 rounded-2xl md:rounded-3xl p-3 sm:p-6 space-y-2 sm:space-y-3">
                    <p className="text-sm sm:text-lg text-amber-50 font-bold">
                      Bitte teile {state.roundNumber} Karten an jeden aus.
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                      {state.players.map((p, i) => (
                        <div
                          key={i}
                          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                            i === state.mixerIndex
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setState(prev => ({
                        ...prev,
                        gamePhase: "bids",
                        currentBidderIndex: 0,
                      }))
                    }
                    className="w-full bg-amber-500 text-slate-950 font-black py-4 md:py-4 rounded-2xl shadow-lg active:bg-amber-600 transition-colors uppercase tracking-widest text-base md:text-sm touch-manipulation"
                  >
                    Karten verteilt
                  </button>
                </div>

                {/* Small Reset Button */}
                <button
                  onClick={resetGame}
                  className="absolute top-3 right-3 md:top-4 md:right-4 px-2 md:px-3 py-1 md:py-2 text-xs text-slate-500 hover:text-red-500 transition-colors uppercase font-bold tracking-wide"
                >
                  ✕
                </button>
              </div>
            )}

            {/* --- BID INPUT (Fullscreen Sequential) --- */}
            {state.gamePhase === "bids" && (
              <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
                <div className="text-center space-y-3 sm:space-y-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <p className="text-amber-500/60 uppercase tracking-widest text-xs sm:text-sm font-bold">
                      Runde {state.roundNumber} – Ansagen
                    </p>
                    <p className="text-xs sm:text-sm text-amber-400">
                      {state.currentBidderIndex + 1} von {state.players.length}
                    </p>
                  </div>

                  <div className="relative inline-block w-full">
                    <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse mx-auto" />
                    <div className="relative space-y-2 sm:space-y-4 p-3 sm:p-8">
                      <p className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-amber-200 leading-tight break-words">
                        {currentBidder?.name}
                      </p>
                      <p className="text-base sm:text-xl text-amber-400 font-bold">
                        Wie viele Stiche?
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 md:gap-4 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...state.pendingBids];
                          next[currentBidderIndex] = Math.max(0, next[currentBidderIndex] - 1);
                          setState(s => ({ ...s, pendingBids: next }));
                        }}
                        className="flex-1 h-16 md:h-16 md:w-16 md:flex-none bg-slate-900 border-2 border-amber-500 rounded-xl text-amber-400 font-bold text-3xl hover:bg-slate-800 active:bg-slate-700 transition-all touch-manipulation"
                      >
                        −
                      </button>
                      <div className="flex-1 flex justify-center">
                        <input
                          key={`bid-${state.currentBidderIndex}`}
                          type="text"
                          inputMode="none"
                          readOnly
                          autoFocus
                          value={state.pendingBids[currentBidderIndex]}
                          className="w-24 h-20 md:w-32 md:h-20 bg-slate-950 border-4 border-amber-500 rounded-2xl text-5xl md:text-6xl font-serif text-amber-400 text-center shadow-2xl focus:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...state.pendingBids];
                          next[currentBidderIndex] = Math.min(state.roundNumber, next[currentBidderIndex] + 1);
                          setState(s => ({ ...s, pendingBids: next }));
                        }}
                        className="flex-1 h-16 md:h-16 md:w-16 md:flex-none bg-slate-900 border-2 border-amber-500 rounded-xl text-amber-400 font-bold text-3xl hover:bg-slate-800 active:bg-slate-700 transition-all touch-manipulation"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-950/40 border border-red-500/50 text-red-200 p-2 sm:p-3 rounded-2xl text-xs sm:text-sm text-center animate-in fade-in zoom-in duration-300">
                      <span className="mr-1 sm:mr-2">❌</span> {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBidSubmit}
                    className="w-full bg-amber-500 text-slate-950 font-black py-4 md:py-4 rounded-2xl shadow-lg active:bg-amber-600 transition-colors uppercase tracking-widest text-base md:text-sm touch-manipulation"
                  >
                    Bestätigen {state.currentBidderIndex === state.players.length - 1 ? "& Weiter" : ""}
                  </button>
                </div>

                {/* Small Reset Button */}
                <button
                  onClick={resetGame}
                  className="absolute top-3 right-3 md:top-4 md:right-4 px-2 md:px-3 py-1 md:py-2 text-xs text-slate-500 hover:text-red-500 transition-colors uppercase font-bold tracking-wide"
                >
                  ✕
                </button>
              </div>
            )}

            {/* --- ACTUAL INPUT (Fullscreen Sequential) --- */}
            {state.gamePhase === "actuals" && (
              <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
                <div className="text-center space-y-3 sm:space-y-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <p className="text-amber-500/60 uppercase tracking-widest text-xs sm:text-sm font-bold">
                      Runde {state.roundNumber} – Abrechnung
                    </p>
                    <p className="text-xs sm:text-sm text-amber-400">
                      {state.currentActualIndex + 1} von {state.players.length}
                    </p>
                  </div>

                  <div className="relative inline-block w-full">
                    <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse mx-auto" />
                    <div className="relative space-y-1 sm:space-y-4 p-3 sm:p-8">
                      <p className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-amber-200 leading-tight break-words">
                        {currentActualBidder?.name}
                      </p>
                      <div className="space-y-1">
                        <p className="text-amber-400 text-sm sm:text-lg">Ansage: {state.pendingBids[currentActualBidderIndex]}</p>
                        <p className="text-base sm:text-xl text-amber-50 font-bold">
                          Stiche gemacht?
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 md:gap-4 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...state.pendingActuals];
                          next[currentActualBidderIndex] = Math.max(0, next[currentActualBidderIndex] - 1);
                          setState(s => ({ ...s, pendingActuals: next }));
                        }}
                        className="flex-1 h-16 md:h-16 md:w-16 md:flex-none bg-slate-900 border-2 border-amber-500 rounded-xl text-amber-400 font-bold text-3xl hover:bg-slate-800 active:bg-slate-700 transition-all touch-manipulation"
                      >
                        −
                      </button>
                      <div className="flex-1 flex justify-center">
                        <input
                          key={`actual-${state.currentActualIndex}`}
                          type="text"
                          inputMode="none"
                          readOnly
                          autoFocus
                          value={state.pendingActuals[currentActualBidderIndex]}
                          className="w-24 h-20 md:w-32 md:h-20 bg-slate-950 border-4 border-amber-500 rounded-2xl text-5xl md:text-6xl font-serif text-amber-400 text-center shadow-2xl focus:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...state.pendingActuals];
                          next[currentActualBidderIndex] = Math.min(state.roundNumber, next[currentActualBidderIndex] + 1);
                          setState(s => ({ ...s, pendingActuals: next }));
                        }}
                        className="flex-1 h-16 md:h-16 md:w-16 md:flex-none bg-slate-900 border-2 border-amber-500 rounded-xl text-amber-400 font-bold text-3xl hover:bg-slate-800 active:bg-slate-700 transition-all touch-manipulation"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-950/40 border border-red-500/50 text-red-200 p-2 sm:p-3 rounded-2xl text-xs sm:text-sm text-center animate-in fade-in zoom-in duration-300">
                      <span className="mr-1 sm:mr-2">❌</span> {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleActualSubmit}
                    className="w-full bg-amber-500 text-slate-950 font-black py-4 md:py-4 rounded-2xl shadow-lg active:bg-amber-600 transition-colors uppercase tracking-widest text-base md:text-sm touch-manipulation"
                  >
                    Bestätigen {state.currentActualIndex === state.players.length - 1 ? "& Abrechnung" : ""}
                  </button>
                </div>

                {/* Small Reset Button */}
                <button
                  onClick={resetGame}
                  className="absolute top-3 right-3 md:top-4 md:right-4 px-2 md:px-3 py-1 md:py-2 text-xs text-slate-500 hover:text-red-500 transition-colors uppercase font-bold tracking-wide"
                >
                  ✕
                </button>
              </div>
            )}

            {/* --- SCOREBOARD --- */}
            {state.gamePhase === "scoreboard" && (
              <div className="w-full h-full p-2 sm:p-4 pb-16 flex flex-col overflow-y-auto">
                <div className="max-w-md mx-auto w-full space-y-3 sm:space-y-4">
                  <div className="text-center py-2 sm:py-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <p className="text-amber-500/60 uppercase tracking-widest text-xs sm:text-sm font-bold mb-1">
                      Runde {state.roundNumber} abgeschlossen
                    </p>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-amber-200">
                      Punktetabelle
                    </h2>
                  </div>

                  <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-950/50 text-[8px] sm:text-[9px] md:text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="px-2 sm:px-6 py-2 sm:py-3">#</th>
                          <th className="px-1 sm:px-2 py-2 sm:py-3">Spieler</th>
                          <th className="px-2 sm:px-6 py-2 sm:py-3 text-right">Pkt.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {leaderboard.map((p, i) => (
                          <tr
                            key={i}
                            className={`transition-colors ${
                              i === 0 ? "bg-amber-500/[0.03]" : ""
                            }`}
                          >
                            <td className="px-2 sm:px-6 py-2">
                              <div
                                className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] md:text-[10px] font-bold ${
                                  i === 0
                                    ? "bg-amber-500 text-slate-950"
                                    : "bg-slate-800 text-slate-500"
                                }`}
                              >
                                {i + 1}
                              </div>
                            </td>
                            <td className="px-1 sm:px-2 py-1 sm:py-2 font-bold text-amber-100/90 truncate text-xs sm:text-sm">
                              {p.name}
                            </td>
                            <td className="px-2 sm:px-6 py-1 sm:py-2 text-right font-serif font-bold text-amber-400 text-xs sm:text-sm">
                              {p.totalScore}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Round Details */}
                  <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-2 sm:p-4 space-y-2">
                    <h3 className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-widest">
                      Diese Runde
                    </h3>
                    <div className="grid gap-1 sm:gap-2">
                      {state.players.map((p, i) => {
                        const roundData = p.history[p.history.length - 1];
                        return (
                          <div
                            key={i}
                            className="flex justify-between items-center text-xs sm:text-sm bg-slate-950/20 p-2 rounded-lg border border-slate-800 gap-1 sm:gap-2"
                          >
                            <span className="font-bold text-amber-50 truncate text-xs">
                              {p.name}
                            </span>
                            <span className="text-slate-400 whitespace-nowrap text-xs">
                              {roundData?.bid}→{roundData?.actual}
                            </span>
                            <span
                              className={`font-serif font-bold whitespace-nowrap text-xs ${
                                roundData && roundData.points >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {roundData && roundData.points >= 0
                                ? `+${roundData.points}`
                                : roundData?.points}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextRound}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl active:from-amber-700 active:to-amber-500 transition-all uppercase tracking-widest text-base animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 touch-manipulation"
                  >
                    {state.roundNumber >= state.totalRounds
                      ? "Spiel beenden"
                      : "Nächste Runde"}
                  </button>
                </div>

                {/* Small Reset Button */}
                <button
                  onClick={resetGame}
                  className="absolute top-3 right-3 md:top-4 md:right-4 px-2 md:px-3 py-1 md:py-2 text-xs text-slate-500 hover:text-red-500 transition-colors uppercase font-bold tracking-wide"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- FINISHED STAGE --- */}
        {state.mainStage === "finished" && (
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div className="text-center space-y-3 sm:space-y-6 max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700 max-h-screen overflow-y-auto">
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-amber-200">
                  Das Schicksal ist besiegelt!
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Der mächtigste Magier ist...
                </p>
              </div>

              <div className="relative inline-block w-full">
                <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse mx-auto" />
                <div className="relative bg-slate-900 border-2 border-amber-400 p-4 sm:p-8 rounded-2xl md:rounded-[2.5rem] shadow-2xl">
                  <p className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-amber-400 mb-1 sm:mb-2 break-words">
                    {leaderboard[0].name}
                  </p>
                  <p className="text-amber-500/60 uppercase tracking-widest font-bold text-xs sm:text-sm">
                    {leaderboard[0].totalScore} Punkte
                  </p>
                </div>
              </div>

              {/* Final Leaderboard */}
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/50 text-[8px] sm:text-[9px] md:text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-2 sm:px-6 py-2 sm:py-3">#</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3">Spieler</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-right">Pkt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {leaderboard.map((p, i) => (
                      <tr
                        key={i}
                        className={`transition-colors ${
                          i === 0 ? "bg-amber-500/[0.03]" : ""
                        }`}
                      >
                        <td className="px-2 sm:px-6 py-2">
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] md:text-[10px] font-bold ${
                              i === 0
                                ? "bg-amber-500 text-slate-950"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-1 sm:px-2 py-1 sm:py-2 font-bold text-amber-100/90 truncate text-xs sm:text-sm">
                          {p.name}
                        </td>
                        <td className="px-2 sm:px-6 py-1 sm:py-2 text-right font-serif font-bold text-amber-400 text-xs sm:text-sm">
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
                className="w-full text-amber-400 hover:text-amber-300 active:text-amber-500 transition-colors uppercase text-sm font-black tracking-[0.3em] py-4 touch-manipulation"
              >
                Ein neues Zeitalter beginnen
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
