"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Users, User } from "lucide-react";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { createInitialState, flipCard, unflipMismatched } from "./logic";
import { loadBest, saveBest } from "./storage";
import type { GameMode, GameState } from "./types";

const FLIP_DELAY = 900;

export default function MemoryGame() {
  const [state, setState] = useState<GameState>(() => createInitialState(4, "1p"));
  const [best4, setBest4] = useState<number | null>(null);
  const [best6, setBest6] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBest4(loadBest(4));
    setBest6(loadBest(6));
  }, []);

  // Save best on win (1P only)
  useEffect(() => {
    if (state.status === "won" && state.mode === "1p") {
      saveBest(state.gridSize, state.moves);
      if (state.gridSize === 4) setBest4((prev) => prev === null ? state.moves : Math.min(prev, state.moves));
      else setBest6((prev) => prev === null ? state.moves : Math.min(prev, state.moves));
    }
  }, [state.status, state.mode, state.moves, state.gridSize]);

  // Unflip mismatch after delay
  useEffect(() => {
    if (!state.lockBoard) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setState((s) => unflipMismatched(s));
    }, FLIP_DELAY);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.lockBoard, state.moves]);

  const handleFlip = useCallback((id: number) => {
    setState((s) => flipCard(s, id));
  }, []);

  const handleReset = useCallback((gridSize?: 4 | 6, mode?: GameMode) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState((s) => createInitialState(gridSize ?? s.gridSize, mode ?? s.mode));
  }, []);

  const cols = state.gridSize === 4 ? 4 : 6;
  const bestScore = state.gridSize === 4 ? best4 : best6;

  return (
    <ToolShell tool="memory">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col leading-none">
            <span
              className="font-sans text-4xl font-black uppercase tracking-tight"
              style={{ color: "var(--accent)" }}
            >
              MEMORY
            </span>
            <span className="mt-1 text-xs text-[var(--vibe-fg-muted)]">
              {state.mode === "2p"
                ? `Spieler ${state.currentPlayer + 1} ist dran`
                : bestScore !== null
                ? `Bestzeit: ${bestScore} Züge`
                : "Finde alle Paare"}
            </span>
          </div>

          <div className="flex items-stretch gap-2">
            {state.mode === "1p" ? (
              <ScoreCard label="Züge" value={state.moves} accent />
            ) : (
              <>
                <ScoreCard label="P1" value={state.scores[0]} accent={state.currentPlayer === 0} />
                <ScoreCard label="P2" value={state.scores[1]} accent={state.currentPlayer === 1} />
              </>
            )}
          </div>
        </div>

        {/* Config bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--vibe-fg-muted)]">Raster</span>
          {([4, 6] as const).map((size) => (
            <button
              key={size}
              onClick={() => handleReset(size)}
              className="rounded-lg px-3 py-1 text-xs font-bold transition-colors"
              style={{
                background: state.gridSize === size ? "var(--accent)" : "var(--accent-soft)",
                color: state.gridSize === size ? "#fff" : "var(--accent-ink)",
              }}
            >
              {size}×{size}
            </button>
          ))}
          <div className="ml-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--vibe-fg-muted)]">Modus</span>
            <button
              onClick={() => handleReset(undefined, "1p")}
              className="flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-colors"
              style={{
                background: state.mode === "1p" ? "var(--accent)" : "var(--accent-soft)",
                color: state.mode === "1p" ? "#fff" : "var(--accent-ink)",
              }}
            >
              <User className="h-3 w-3" /> Solo
            </button>
            <button
              onClick={() => handleReset(undefined, "2p")}
              className="flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-colors"
              style={{
                background: state.mode === "2p" ? "var(--accent)" : "var(--accent-soft)",
                color: state.mode === "2p" ? "#fff" : "var(--accent-ink)",
              }}
            >
              <Users className="h-3 w-3" /> 2P
            </button>
          </div>
          <button
            onClick={() => handleReset()}
            className="ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
            style={{
              borderColor: "var(--accent-line)",
              color: "var(--accent-ink)",
              background: "var(--accent-soft)",
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Neu
          </button>
        </div>

        {/* Board */}
        <div
          className="grid w-full gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {state.cards.map((card) => (
            <CardTile
              key={card.id}
              symbol={card.symbol}
              state={card.state}
              onClick={() => handleFlip(card.id)}
            />
          ))}
        </div>

        {/* Win overlay */}
        <AnimatePresence>
          {state.status === "won" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-6"
              style={{ background: "rgba(10,8,16,0.82)" }}
            >
              <div
                className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl p-6"
                style={{
                  background: "var(--vibe-bg-elevated)",
                  boxShadow: "var(--vibe-shadow-lifted)",
                }}
              >
                <span className="text-4xl">🎉</span>
                <p className="text-xl font-black" style={{ color: "var(--accent)" }}>
                  {state.mode === "2p"
                    ? state.scores[0] > state.scores[1]
                      ? "Spieler 1 gewinnt!"
                      : state.scores[1] > state.scores[0]
                      ? "Spieler 2 gewinnt!"
                      : "Unentschieden!"
                    : "Alle Paare gefunden!"}
                </p>
                {state.mode === "1p" && (
                  <p className="text-sm text-[var(--vibe-fg-muted)]">
                    {state.moves} Züge
                    {bestScore !== null && bestScore === state.moves && " · Neuer Rekord! 🏆"}
                  </p>
                )}
                {state.mode === "2p" && (
                  <p className="text-sm text-[var(--vibe-fg-muted)]">
                    P1: {state.scores[0]} · P2: {state.scores[1]}
                  </p>
                )}
                <button
                  onClick={() => handleReset()}
                  className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md"
                  style={{ background: "var(--accent)" }}
                >
                  Nochmal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolShell>
  );
}

function CardTile({
  symbol,
  state,
  onClick,
}: {
  symbol: string;
  state: "hidden" | "flipped" | "matched";
  onClick: () => void;
}) {
  const isVisible = state !== "hidden";

  return (
    <button
      onClick={onClick}
      disabled={state !== "hidden"}
      className="relative aspect-square w-full overflow-hidden rounded-xl transition-transform active:scale-95"
      style={{
        background: isVisible
          ? state === "matched"
            ? "color-mix(in srgb, var(--accent) 18%, var(--tool-surface))"
            : "var(--vibe-bg-elevated)"
          : "var(--accent-soft)",
        boxShadow: isVisible
          ? state === "matched"
            ? "inset 0 0 0 2px var(--accent)"
            : "var(--vibe-shadow-soft)"
          : "var(--vibe-shadow-flat)",
        cursor: state === "hidden" ? "pointer" : "default",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isVisible ? (
          <motion.span
            key="symbol"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            {symbol}
          </motion.span>
        ) : (
          <motion.span
            key="back"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span
              className="h-4 w-4 rounded-full opacity-30"
              style={{ background: "var(--accent)" }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function ScoreCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="flex min-w-[4.5rem] flex-col items-center rounded-xl px-3 py-1.5"
      style={{
        background: accent ? "var(--accent)" : "var(--vibe-bg-tinted)",
        color: accent ? "#fff" : "var(--vibe-fg-base)",
        boxShadow: "var(--vibe-shadow-soft)",
      }}
    >
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] opacity-75">
        {label}
      </span>
      <span className="font-mono text-xl font-black tabular-nums leading-tight">
        {value}
      </span>
    </div>
  );
}
