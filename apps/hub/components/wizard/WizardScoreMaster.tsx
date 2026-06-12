"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconMinus, IconPlus } from "@/components/ui/icons";
import { CloseGameButton, ErrorBanner, BigNumber } from "@/components/wizard/components/Common";
import {
  DUMMY_PLAYER_NAME,
  MAX_NAME_LEN,
  calculatePoints,
  getNextBidderIndex,
  getNextMixerIndex,
  getPlayerOrder,
  getRandomMixerIndex,
  getRoundCount,
  isDummyPlayer,
} from "@/components/wizard/scoring";
import { INITIAL_STATE } from "@/components/wizard/state";
import {
  clearWizardState,
  loadWizardState,
  saveWizardState,
} from "@/components/wizard/storage";
import {
  card,
  glow,
  primaryBtn,
  shell,
  stageCenterWrap,
  stepperBtn,
} from "@/components/wizard/styles";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import type { GameState } from "@/components/wizard/types";

export default function WizardScoreMaster() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [setupPlayerCount, setSetupPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(() =>
    Array.from({ length: 2 }, () => ""),
  );
  const [error, setError] = useState<string | null>(null);
  const isHydrated = useRef(false);

  useEffect(() => {
    try {
      const loaded = loadWizardState();
      queueMicrotask(() => {
        if (loaded) {
          setState(loaded);
        }
        isHydrated.current = true;
      });
    } catch (e) {
      console.error("Fehler beim Laden des Spielstands", e);
      clearWizardState();
      isHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (isHydrated.current) {
      saveWizardState(state);
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
  const biddingPlayerOrder = bidderOrder.filter(
    (playerIndex) => !isDummyPlayer(state.players[playerIndex]),
  );
  const currentBidderPlayerIndex =
    biddingPlayerOrder[state.currentBidderIndex] ?? biddingPlayerOrder[0] ?? 0;
  const currentBidder = state.players[currentBidderPlayerIndex];

  const actualOrder = getPlayerOrder(0, state.players.length);
  const currentActualBidderIndex = actualOrder[state.currentActualIndex];
  const currentActualBidder = state.players[currentActualBidderIndex];

  const handleStartGame = useCallback(() => {
    setError(null);
    const selectedPlayerCount = setupPlayerCount;
    const names = playerNames
      .slice(0, selectedPlayerCount)
      .map((s, i) => s.trim() || `Spieler ${i + 1}`);
    if (
      selectedPlayerCount === 2 &&
      names.some((n) => n.toLowerCase() === DUMMY_PLAYER_NAME.toLowerCase())
    ) {
      setError(`"${DUMMY_PLAYER_NAME}" ist für den Dummy-Spieler reserviert.`);
      return;
    }
    const finalNames =
      selectedPlayerCount === 2 ? [...names, DUMMY_PLAYER_NAME] : names;
    const lower = names.map((n) => n.toLowerCase());
    if (new Set(lower).size !== names.length) {
      setError("Die Namen müssen sich unterscheiden.");
      return;
    }

    const players = finalNames.map((name) => ({
      name,
      isDummy: name === DUMMY_PLAYER_NAME,
      totalScore: 0,
      history: [],
    }));
    const playerCount = players.length;
    const randomMixer = getRandomMixerIndex(players);
    const roundCount = getRoundCount(playerCount);

    setState({
      mainStage: "game",
      gamePhase: selectedPlayerCount === 2 ? "rules" : "mixer-announcement",
      players,
      totalRounds: roundCount,
      roundNumber: 1,
      mixerIndex: randomMixer,
      currentBidderIndex: 0,
      currentActualIndex: 0,
      pendingBids: new Array(playerCount).fill(0),
      pendingActuals: new Array(playerCount).fill(0),
    });
  }, [setupPlayerCount, playerNames]);

  const handleBidBack = useCallback(() => {
    setError(null);
    if (state.currentBidderIndex === 0) {
      setState((prev) => ({ ...prev, gamePhase: "mixer-announcement" }));
    } else {
      setState((prev) => ({
        ...prev,
        currentBidderIndex: prev.currentBidderIndex - 1,
      }));
    }
  }, [state.currentBidderIndex]);

  const handleActualBack = useCallback(() => {
    setError(null);
    if (state.currentActualIndex === 0) {
      setState((prev) => ({
        ...prev,
        gamePhase: "bid-summary",
      }));
    } else {
      setState((prev) => ({
        ...prev,
        currentActualIndex: prev.currentActualIndex - 1,
      }));
    }
  }, [state.currentActualIndex, biddingPlayerOrder.length]);

  const handleScoreboardBack = useCallback(() => {
    setError(null);
    // Undo the round: revert players to pre-round state
    setState((prev) => ({
      ...prev,
      gamePhase: "actuals",
      currentActualIndex: prev.players.length - 1,
      players: prev.players.map((p) => {
        const last = p.history[p.history.length - 1];
        if (!last || last.roundNumber !== prev.roundNumber) return p;
        return {
          ...p,
          totalScore: p.totalScore - last.points,
          history: p.history.slice(0, -1),
        };
      }),
    }));
  }, []);

  const handleBidSubmit = useCallback(() => {
    setError(null);

    const isLastBidder =
      state.currentBidderIndex === biddingPlayerOrder.length - 1;

    if (isLastBidder) {
      const sumBids = biddingPlayerOrder.reduce(
        (sum, idx) => sum + state.pendingBids[idx],
        0,
      );
      if (sumBids === state.roundNumber) {
        setError(
          `Die Summe der Ansagen darf nicht ${state.roundNumber} sein.`,
        );
        return;
      }
      setState((prev) => ({
        ...prev,
        gamePhase: "bid-summary",
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
    biddingPlayerOrder,
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
        const points = isDummyPlayer(p)
          ? state.pendingActuals[i] * 10
          : calculatePoints(state.pendingBids[i], state.pendingActuals[i]);
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
      const nextMixerIndex = getNextMixerIndex(state.players, state.mixerIndex);

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
    state.players,
  ]);

  const resetGame = useCallback(() => {
    if (confirm("Möchtest du das aktuelle Spiel wirklich beenden?")) {
      clearWizardState();
      setState(INITIAL_STATE);
      setPlayerNames(Array.from({ length: setupPlayerCount }, () => ""));
    }
  }, [setupPlayerCount]);

  const titleClass =
    "font-display text-3xl font-bold tracking-tighter text-[var(--accent)] sm:text-4xl md:text-5xl";

  const labelMuted =
    "text-[10px] font-black uppercase tracking-widest text-[var(--accent)]/70 sm:text-xs";

  return (
    <ToolShell tool="wizard" fullBleed className={`${shell} overscroll-none`} style={{ touchAction: "manipulation" }}>
      <div className={glow} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {state.mainStage === "setup" && (
          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-4 sm:py-4">
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
                    <div className="mx-auto mt-2 grid w-full max-w-[18rem] grid-cols-5 gap-2 sm:mt-3 sm:max-w-xs sm:gap-3">
                      {[2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setSetupPlayerCount(n);
                            setPlayerNames((prev) =>
                              Array.from({ length: n }, (_, i) =>
                                prev[i] ?? "",
                              ),
                            );
                            setError(null);
                          }}
                          className={
                            `flex aspect-square w-full max-h-14 shrink-0 items-center justify-center rounded-full border-2 font-display text-base transition-colors sm:max-h-16 sm:text-lg touch-manipulation ` +
                            (setupPlayerCount === n
                              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
                              : "border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/60 text-[var(--vibe-fg-muted)] hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]")
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
                            "w-full rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-4 py-3 text-base text-[var(--vibe-fg-base)] outline-none " +
                            "placeholder:text-[var(--vibe-fg-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
                          }
                          placeholder={`Spieler ${i + 1}`}
                          autoComplete="off"
                          autoCapitalize="words"
                          enterKeyHint="done"
                          inputMode="text"
                        />
                      </label>
                    ))}
                    {setupPlayerCount === 2 && (
                      <label className="block opacity-60">
                        <span
                          className={`${labelMuted} mb-1.5 block text-left text-[10px] sm:text-xs`}
                        >
                          Dummy-Spieler
                        </span>
                        <input
                          type="text"
                          value={DUMMY_PLAYER_NAME}
                          disabled
                          className={
                            "w-full rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)]/70 px-4 py-3 text-base text-[var(--vibe-fg-muted)] outline-none opacity-60"
                          }
                        />
                      </label>
                    )}
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
              <div className={stageCenterWrap}>
                <CloseGameButton onClick={resetGame} />
                <div className="w-full max-w-md space-y-3 text-center sm:space-y-6 app-page-enter">
                  <div className="space-y-2 sm:space-y-3">
                    <p className={labelMuted}>
                      Runde {state.roundNumber} von {state.totalRounds}
                    </p>
                    <div className="relative inline-block w-full">
                      <div className="absolute inset-0 mx-auto opacity-20 blur-3xl motion-safe:animate-pulse" style={{ background: "var(--accent)" }} />
                      <div className="relative space-y-2 p-4 sm:space-y-4 sm:p-8">
                        <p className="break-words font-display text-3xl font-black leading-tight text-[var(--vibe-fg-base)] sm:text-5xl md:text-6xl">
                          {currentMixer?.name}
                        </p>
                        <p className="text-lg font-bold text-[var(--accent)] sm:text-xl md:text-2xl">
                          ist der Mischer
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="space-y-2 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/50 p-3 sm:space-y-3 sm:p-6 md:rounded-[var(--vibe-r-2xl)]"
                  >
                    <p className="text-sm font-bold text-[var(--vibe-fg-base)] sm:text-lg">
                      Bitte teile {state.roundNumber} Karten an jeden aus.
                    </p>
                    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                      {state.players.map((p, i) => (
                        <div
                          key={i}
                          className={
                            `min-h-[2.5rem] min-w-0 break-words rounded-[var(--vibe-r-md)] px-2 py-2 text-center text-xs font-bold leading-snug sm:text-sm ` +
                            (i === state.mixerIndex
                              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                              : "bg-[var(--vibe-bg-elevated)]/80 text-[var(--vibe-fg-muted)]")
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

            {state.gamePhase === "rules" && (
              <div className={stageCenterWrap}>
                <CloseGameButton onClick={resetGame} />
                <div className="w-full max-w-md space-y-3 text-center sm:space-y-6 app-page-enter">
                  <div className="space-y-2 sm:space-y-3">
                    <p className={labelMuted}>2-Spieler-Regeln mit Bruv</p>
                    <h2 className="font-display text-2xl font-bold text-[var(--vibe-fg-base)] sm:text-3xl">
                      Zusatzregeln
                    </h2>
                  </div>
                  <div className="space-y-4 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/50 p-5 text-left text-sm leading-relaxed text-[var(--vibe-fg-base)] sm:text-base">
  <h3 className="font-semibold text-[var(--vibe-fg-base)]">So spielt der Dummy mit:</h3>
  
  <ul className="space-y-3 list-none">
    <li className="flex gap-2">
      <span className="text-[var(--accent)]">•</span>
      <p><strong>Setup:</strong> Vor jeder Runde wird rechts von der verteilenden Person ein dritter Stapel für <strong>{DUMMY_PLAYER_NAME}</strong> gebildet.</p>
    </li>
    <li className="flex gap-2">
      <span className="text-[var(--accent)]">•</span>
      <p><strong>Spielzug:</strong> Ist der Dummy an der Reihe, wird einfach die oberste Karte seines Stapels aufgedeckt.</p>
    </li>
    <li className="flex gap-2">
      <span className="text-[var(--accent)]">•</span>
      <p><strong>Wertung:</strong> Der Dummy gibt keine Ansage ab. Jeder gewonnene Stich zählt fix <strong>10 Punkte</strong> – ohne Abzüge oder Bonuspunkte.</p>
    </li>
  </ul>
</div>
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        gamePhase: "mixer-announcement",
                      }))
                    }
                    className={primaryBtn}
                  >
                    Regeln verstanden
                  </button>
                </div>
              </div>
            )}

            {state.gamePhase === "bids" && (
              <div className={stageCenterWrap}>
                <CloseGameButton onClick={resetGame} />
                <div className="w-full max-w-md space-y-3 text-center sm:space-y-6 app-page-enter">
                  <div className="space-y-1">
                    <p className={labelMuted}>
                      Runde {state.roundNumber} – Ansagen
                    </p>
                    <p className="text-xs text-[var(--accent)]/80 sm:text-sm">
                      {state.currentBidderIndex + 1} von {biddingPlayerOrder.length}
                    </p>
                  </div>

                  <div className="relative inline-block w-full">
                    <div className="absolute inset-0 mx-auto opacity-20 blur-3xl motion-safe:animate-pulse" style={{ background: "var(--accent)" }} />
                    <div className="relative space-y-2 p-3 sm:space-y-4 sm:p-8">
                      <p className="break-words font-display text-3xl font-black leading-tight text-[var(--vibe-fg-base)] sm:text-5xl md:text-6xl">
                        {currentBidder?.name}
                      </p>
                      <p className="text-base font-bold text-[var(--accent)] sm:text-xl">
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
                          next[currentBidderPlayerIndex] = Math.max(
                            0,
                            next[currentBidderPlayerIndex] - 1,
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
                          value={state.pendingBids[currentBidderPlayerIndex]}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...state.pendingBids];
                          next[currentBidderPlayerIndex] = Math.min(
                            state.roundNumber,
                            next[currentBidderPlayerIndex] + 1,
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

                  {state.currentBidderIndex > 0 && (
                    <div className="overflow-hidden rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/40">
                      {biddingPlayerOrder.slice(0, state.currentBidderIndex).map((pi) => (
                        <div key={pi} className="flex items-center justify-between px-3 py-1.5 text-xs border-b last:border-0 border-[var(--vibe-line)]">
                          <span className="font-medium text-[var(--vibe-fg-base)]">{state.players[pi]?.name}</span>
                          <span className="font-bold text-[var(--accent)]">{state.pendingBids[pi]}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {error ? <ErrorBanner message={error} /> : null}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleBidBack}
                      className="flex-none rounded-[var(--vibe-r-xl)] border-2 border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/60 px-4 py-4 text-sm font-black text-[var(--accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] touch-manipulation"
                      aria-label="Zurück"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={handleBidSubmit}
                      className={`${primaryBtn} flex-1`}
                    >
                      {state.currentBidderIndex === biddingPlayerOrder.length - 1
                        ? "Bestätigen und weiter"
                        : "Bestätigen"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {state.gamePhase === "bid-summary" && (
              <div className={stageCenterWrap}>
                <CloseGameButton onClick={resetGame} />
                <div className="w-full max-w-md space-y-3 text-center sm:space-y-6 app-page-enter">
                  <div className="space-y-1">
                    <p className={labelMuted}>Runde {state.roundNumber} – Ansagen</p>
                    <h2 className="font-display text-xl font-bold text-[var(--vibe-fg-base)] sm:text-2xl">
                      Übersicht
                    </h2>
                  </div>

                  <div className="overflow-hidden rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/50">
                    {biddingPlayerOrder.map((pi) => (
                      <div
                        key={pi}
                        className="flex items-center justify-between border-b border-[var(--vibe-line)] px-4 py-3 last:border-0"
                      >
                        <span className="font-bold text-[var(--vibe-fg-base)]">
                          {state.players[pi]?.name}
                        </span>
                        <span className="font-display text-lg font-bold text-[var(--accent)]">
                          {state.pendingBids[pi]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          gamePhase: "bids",
                          currentBidderIndex: biddingPlayerOrder.length - 1,
                        }))
                      }
                      className="flex-none rounded-[var(--vibe-r-xl)] border-2 border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/60 px-4 py-4 text-sm font-black text-[var(--accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] touch-manipulation"
                      aria-label="Zurück"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          gamePhase: "actuals",
                          currentActualIndex: 0,
                        }))
                      }
                      className={`${primaryBtn} flex-1`}
                    >
                      Spiel starten
                    </button>
                  </div>
                </div>
              </div>
            )}

            {state.gamePhase === "actuals" && (
              <div className={stageCenterWrap}>
                <CloseGameButton onClick={resetGame} />
                <div className="w-full max-w-md space-y-3 text-center sm:space-y-6 app-page-enter">
                  <div className="space-y-1">
                    <p className={labelMuted}>
                      Runde {state.roundNumber} – Abrechnung
                    </p>
                    <p className="text-xs text-[var(--accent)]/80 sm:text-sm">
                      {state.currentActualIndex + 1} von {state.players.length}
                    </p>
                  </div>

                  <div className="relative inline-block w-full">
                    <div className="absolute inset-0 mx-auto opacity-20 blur-3xl motion-safe:animate-pulse" style={{ background: "var(--accent)" }} />
                    <div className="relative space-y-1 p-3 sm:space-y-4 sm:p-8">
                      <p className="break-words font-display text-3xl font-black leading-tight text-[var(--vibe-fg-base)] sm:text-5xl md:text-6xl">
                        {currentActualBidder?.name}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm text-[var(--vibe-fg-muted)] sm:text-lg">
                          Ansage: {state.pendingBids[currentActualBidderIndex]}
                        </p>
                        <p className="text-base font-bold text-[var(--vibe-fg-base)] sm:text-xl">
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

                  {/* Ansagen-Übersicht aller Spieler */}
                  <div className="overflow-hidden rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/40">
                    {actualOrder.map((pi) => {
                      const isDone = pi < actualOrder[state.currentActualIndex];
                      const isCurrent = pi === currentActualBidderIndex;
                      return (
                        <div
                          key={pi}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs border-b last:border-0 border-[var(--vibe-line)] ${isCurrent ? "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : ""}`}
                        >
                          <span className={`font-medium ${isCurrent ? "text-[var(--vibe-fg-base)]" : "text-[var(--vibe-fg-muted)]"}`}>
                            {state.players[pi]?.name}
                          </span>
                          <span className="flex gap-2 tabular-nums">
                            <span className="text-[var(--accent)]/70">
                              Ansage: {state.pendingBids[pi]}
                            </span>
                            {isDone && (
                              <span className="font-bold text-[var(--vibe-fg-base)]">
                                → {state.pendingActuals[pi]}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {error ? <ErrorBanner message={error} /> : null}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleActualBack}
                      className="flex-none rounded-[var(--vibe-r-xl)] border-2 border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/60 px-4 py-4 text-sm font-black text-[var(--accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] touch-manipulation"
                      aria-label="Zurück"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={handleActualSubmit}
                      className={`${primaryBtn} flex-1`}
                    >
                      {state.currentActualIndex === state.players.length - 1
                        ? "Bestätigen und Abrechnung"
                        : "Bestätigen"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {state.gamePhase === "scoreboard" && (
              <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden px-3 py-3 pb-16 sm:px-4 sm:py-4">
                <CloseGameButton onClick={resetGame} />
                <div className="mx-auto w-full max-w-md space-y-3 sm:space-y-4">
                  <div className="py-2 text-center sm:py-3 app-page-enter">
                    <p className={`${labelMuted} mb-1`}>
                      Runde {state.roundNumber} abgeschlossen
                    </p>
                    <h2 className="font-display text-xl font-bold text-[var(--vibe-fg-base)] sm:text-2xl md:text-3xl">
                      Punktetabelle
                    </h2>
                  </div>

                  <div
                    className={
                      "overflow-hidden rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/50 app-page-enter"
                    }
                  >
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[8px] font-bold uppercase text-[var(--vibe-fg-faint)] sm:text-[9px] md:text-[10px]">
                        <tr>
                          <th className="px-2 py-2 sm:px-6 sm:py-3">#</th>
                          <th className="px-1 py-2 sm:px-2 sm:py-3">Spieler</th>
                          <th className="px-2 py-2 text-right sm:px-6 sm:py-3">
                            Pkt.
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--vibe-line)]">
                        {leaderboard.map((p, i) => (
                          <tr
                            key={`sb-${i}-${p.name}`}
                            className={
                              i === 0
                                ? "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                                : ""
                            }
                          >
                            <td className="px-2 py-2 sm:px-6">
                              <div
                                className={
                                  `flex h-4 w-4 items-center justify-center rounded-[var(--vibe-r-xs)] text-[7px] font-bold sm:h-5 sm:w-5 sm:text-[8px] md:h-6 md:w-6 md:text-[10px] ` +
                                  (i === 0
                                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                                    : "bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--vibe-fg-muted)]")
                                }
                              >
                                {i + 1}
                              </div>
                            </td>
                            <td className="truncate px-1 py-1 text-xs font-bold text-[var(--vibe-fg-base)] sm:px-2 sm:py-2 sm:text-sm">
                              {p.name}
                            </td>
                            <td className="px-2 py-1 text-right font-display text-xs font-bold text-[var(--accent)] sm:px-6 sm:py-2 sm:text-sm">
                              {p.totalScore}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className={
                      "space-y-2 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/50 p-2 sm:p-4"
                    }
                  >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] sm:text-sm">
                      Diese Runde
                    </h3>
                    <div className="grid gap-1 sm:gap-2">
                      {state.players.map((p, i) => {
                        const roundData = p.history[p.history.length - 1];
                        return (
                          <div
                            key={i}
                            className={
                              "flex items-center justify-between gap-1 rounded-[var(--vibe-r-md)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)]/50 p-2 text-xs sm:gap-2 sm:text-sm"
                            }
                          >
                            <span className="truncate font-bold text-[var(--vibe-fg-base)]">
                              {p.name}
                            </span>
                            <span className="whitespace-nowrap text-[var(--vibe-fg-muted)]">
                              {roundData?.bid} / {roundData?.actual}
                            </span>
                            <span
                              className={
                                `whitespace-nowrap font-display text-xs font-bold sm:text-sm ` +
                                (roundData && roundData.points >= 0
                                  ? "text-[var(--pasch-success)]"
                                  : "text-[var(--pasch-carmine)]")
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

                  <div className="flex gap-2 app-page-enter">
                    <button
                      type="button"
                      onClick={handleScoreboardBack}
                      className="flex-none rounded-[var(--vibe-r-xl)] border-2 border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/60 px-4 py-4 text-sm font-black text-[var(--accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] touch-manipulation"
                      aria-label="Zurück zur Abrechnung"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={handleNextRound}
                      className={
                        "flex-1 rounded-[var(--vibe-r-xl)] bg-[var(--accent)] py-4 text-base font-black uppercase tracking-widest text-[var(--accent-ink)] shadow-[var(--vibe-shadow-lifted)] " +
                        "transition-all hover:brightness-95 active:scale-[0.98] touch-manipulation"
                      }
                    >
                      {state.roundNumber >= state.totalRounds
                        ? "Spiel beenden"
                        : "Nächste Runde"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {state.mainStage === "finished" && (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
            <div className="max-h-full w-full max-w-md space-y-3 overflow-hidden text-center sm:space-y-6 app-page-enter">
              <div className="space-y-1 sm:space-y-2">
                <h2 className="font-display text-xl font-bold text-[var(--vibe-fg-base)] sm:text-2xl md:text-3xl">
                  Das Schicksal ist besiegelt!
                </h2>
                <p className="text-xs text-[var(--vibe-fg-muted)] sm:text-sm">
                  Der mächtigste Magier ist...
                </p>
              </div>

              <div className="relative inline-block w-full">
                <div className="absolute inset-0 mx-auto opacity-20 blur-3xl motion-safe:animate-pulse" style={{ background: "var(--accent)" }} />
                <div
                  className={
                    "relative rounded-[var(--vibe-r-xl)] border-2 border-[var(--accent-line)] bg-[var(--vibe-bg-elevated)]/80 p-4 shadow-[var(--vibe-edge),var(--vibe-shadow-lifted)] sm:p-8 md:rounded-[var(--vibe-r-2xl)]"
                  }
                >
                  <p className="mb-1 break-words font-display text-3xl font-black text-[var(--accent)] sm:mb-2 sm:text-4xl md:text-5xl">
                    {leaderboard[0]?.name ?? "–"}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]/80 sm:text-sm">
                    {leaderboard[0]?.totalScore ?? 0} Punkte
                  </p>
                </div>
              </div>

              <div
                className={
                  "overflow-hidden rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/50"
                }
              >
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[8px] font-bold uppercase text-[var(--vibe-fg-faint)] sm:text-[9px] md:text-[10px]">
                    <tr>
                      <th className="px-2 py-2 sm:px-6 sm:py-3">#</th>
                      <th className="px-1 py-2 sm:px-2 sm:py-3">Spieler</th>
                      <th className="px-2 py-2 text-right sm:px-6 sm:py-3">
                        Pkt.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--vibe-line)]">
                    {leaderboard.map((p, i) => (
                      <tr
                        key={`fin-${i}-${p.name}`}
                        className={
                          i === 0
                            ? "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                            : ""
                        }
                      >
                        <td className="px-2 py-2 sm:px-6">
                          <div
                            className={
                              `flex h-4 w-4 items-center justify-center rounded-[var(--vibe-r-xs)] text-[7px] font-bold sm:h-5 sm:w-5 sm:text-[8px] md:h-6 md:w-6 md:text-[10px] ` +
                              (i === 0
                                ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                                : "bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--vibe-fg-muted)]")
                            }
                          >
                            {i + 1}
                          </div>
                        </td>
                        <td className="truncate px-1 py-1 text-xs font-bold text-[var(--vibe-fg-base)] sm:px-2 sm:py-2 sm:text-sm">
                          {p.name}
                        </td>
                        <td className="px-2 py-1 text-right font-display text-xs font-bold text-[var(--accent)] sm:px-6 sm:py-2 sm:text-sm">
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
                  "w-full py-4 text-sm font-black uppercase tracking-[0.2em] text-[var(--accent)] transition-colors hover:opacity-75 touch-manipulation"
                }
              >
                Ein neues Zeitalter beginnen
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
