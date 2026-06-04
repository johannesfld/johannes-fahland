"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw, Trophy, ArrowUp } from "lucide-react";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import {
  continueAfterWin,
  createInitialState,
  move as moveEngine,
} from "./logic";
import { clearState, loadBest, loadState, saveBest, saveState } from "./storage";
import { BOARD_SIZE, type Direction, type GameState, type Tile } from "./types";

const SWIPE_THRESHOLD = 32;

function tileColors(value: number): { bg: string; fg: string; shadow: string } {
  // Vibe-coded palette stepping from soft to vivid via Plum→Amber accents.
  switch (value) {
    case 2:    return { bg: "#F0EAFB", fg: "#3D2776", shadow: "0 2px 10px -4px rgba(124,91,217,0.20)" };
    case 4:    return { bg: "#E1D4F5", fg: "#2A1B52", shadow: "0 2px 10px -4px rgba(124,91,217,0.25)" };
    case 8:    return { bg: "#C9B2EE", fg: "#1F1244", shadow: "0 3px 14px -5px rgba(124,91,217,0.35)" };
    case 16:   return { bg: "#A988E2", fg: "#FFFFFF", shadow: "0 4px 16px -6px rgba(124,91,217,0.45)" };
    case 32:   return { bg: "#8B65D6", fg: "#FFFFFF", shadow: "0 5px 18px -6px rgba(124,91,217,0.55)" };
    case 64:   return { bg: "#7C5BD9", fg: "#FFFFFF", shadow: "0 6px 22px -8px rgba(124,91,217,0.65)" };
    case 128:  return { bg: "#E8AE3D", fg: "#3A2300", shadow: "0 6px 22px -8px rgba(232,174,61,0.55)" };
    case 256:  return { bg: "#E89C2A", fg: "#3A2300", shadow: "0 7px 24px -8px rgba(232,156,42,0.60)" };
    case 512:  return { bg: "#E58A1C", fg: "#FFFFFF", shadow: "0 8px 28px -10px rgba(229,138,28,0.65)" };
    case 1024: return { bg: "#DE7510", fg: "#FFFFFF", shadow: "0 9px 30px -10px rgba(222,117,16,0.70)" };
    case 2048: return { bg: "#D55F08", fg: "#FFFFFF", shadow: "0 10px 32px -10px rgba(213,95,8,0.80)" };
    case 4096: return { bg: "#C24A03", fg: "#FFFFFF", shadow: "0 10px 32px -10px rgba(194,74,3,0.80)" };
    default:   return { bg: "#1F0A03", fg: "#FFD58A", shadow: "0 12px 36px -10px rgba(255,213,138,0.40)" };
  }
}

function tileFontSize(value: number): string {
  const digits = String(value).length;
  if (digits <= 2) return "clamp(1.5rem, 7vw, 2.5rem)";
  if (digits === 3) return "clamp(1.25rem, 6vw, 2.1rem)";
  if (digits === 4) return "clamp(1rem, 5vw, 1.75rem)";
  return "clamp(0.85rem, 4vw, 1.4rem)";
}

function TileView({
  tile,
  cellPercent,
  reduced,
}: {
  tile: Tile;
  cellPercent: number;
  reduced: boolean | null;
}) {
  const colors = tileColors(tile.value);
  const left = tile.col * cellPercent;
  const top = tile.row * cellPercent;

  return (
    <motion.div
      layout={!reduced}
      initial={
        tile.isNew
          ? { scale: 0, opacity: 0 }
          : tile.mergedFrom
          ? { scale: 1 }
          : false
      }
      animate={
        tile.mergedFrom && !reduced
          ? { scale: [1, 1.18, 1], opacity: 1 }
          : { scale: 1, opacity: 1 }
      }
      transition={{
        layout: { type: "spring", stiffness: 700, damping: 38, mass: 0.6 },
        scale: tile.mergedFrom
          ? { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
          : { type: "spring", stiffness: 500, damping: 28 },
        opacity: { duration: 0.16 },
      }}
      style={{
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: `${cellPercent}%`,
        height: `${cellPercent}%`,
        padding: "2.5%",
        pointerEvents: "none",
      }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-[12%] font-bold tabular-nums"
        style={{
          background: colors.bg,
          color: colors.fg,
          fontSize: tileFontSize(tile.value),
          boxShadow: colors.shadow,
          letterSpacing: "-0.02em",
        }}
      >
        {tile.value}
      </div>
    </motion.div>
  );
}

function ScoreCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="flex min-w-[5rem] flex-col items-center rounded-xl px-3 py-1.5"
      style={{
        background: accent ? "var(--accent)" : "var(--vibe-bg-tinted)",
        color: accent ? "#FFFFFF" : "var(--vibe-fg-base)",
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

export default function Game2048() {
  const reduced = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<GameState>(() => createInitialState(0));
  const lastDirRef = useRef<Direction | null>(null);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    const best = loadBest();
    const saved = loadState();
    if (saved) {
      setState({ ...saved, best: Math.max(saved.best, best) });
    } else {
      setState(createInitialState(best));
    }
    setHydrated(true);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
    saveBest(state.best);
  }, [state, hydrated]);

  const doMove = useCallback((dir: Direction) => {
    lastDirRef.current = dir;
    setState((prev) => moveEngine(prev, dir).state);
  }, []);

  const reset = useCallback(() => {
    setState((prev) => createInitialState(prev.best));
    clearState();
  }, []);

  const keepGoing = useCallback(() => {
    setState((prev) => continueAfterWin(prev));
  }, []);

  // Keyboard controls
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      let dir: Direction | null = null;
      switch (e.key) {
        case "ArrowUp": case "w": case "W": dir = "up"; break;
        case "ArrowDown": case "s": case "S": dir = "down"; break;
        case "ArrowLeft": case "a": case "A": dir = "left"; break;
        case "ArrowRight": case "d": case "D": dir = "right"; break;
      }
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  // Touch / swipe controls
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current) e.preventDefault();
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      doMove(dx > 0 ? "right" : "left");
    } else {
      doMove(dy > 0 ? "down" : "up");
    }
  }, [doMove]);

  const cellPercent = 100 / BOARD_SIZE;
  const sortedTiles = useMemo(
    () => [...state.tiles].sort((a, b) => a.id - b.id),
    [state.tiles],
  );

  const showWin = state.status === "won" && !state.keepPlaying;
  const showOver = state.status === "over";

  return (
    <ToolShell tool="g2048" fullBleed>
      <div
        className="flex h-full w-full flex-col items-center justify-start gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-[calc(0.5rem+64px+env(safe-area-inset-bottom,0px))] sm:gap-4 sm:px-4 sm:py-6 sm:pb-6"
      >
        {/* Header */}
        <div className="flex w-full max-w-[28rem] shrink-0 items-center justify-between gap-3">
          <div className="flex flex-col leading-none">
            <span
              className="font-sans text-3xl font-black uppercase tracking-tight sm:text-4xl"
              style={{ color: "var(--accent)" }}
            >
              2048
            </span>
            <span className="mt-0.5 hidden text-xs text-[var(--vibe-fg-muted)] sm:block">
              Wische oder Pfeiltasten
            </span>
          </div>
          <div className="flex items-stretch gap-2">
            <ScoreCard label="Punkte" value={state.score} accent />
            <ScoreCard label="Best" value={state.best} />
          </div>
        </div>

        {/* Board */}
        <div className="relative flex w-full max-w-[28rem] flex-1 items-center justify-center" style={{ minHeight: 0 }}>
          <div
            className="relative aspect-square w-full overflow-hidden rounded-2xl"
            style={{
              maxHeight: "100%",
              maxWidth: "calc(min(100vh,100%) - 0px)",
              background: "var(--tool-surface)",
              padding: "2.5%",
              boxShadow: "var(--vibe-shadow-lifted), inset 0 0 0 1px var(--accent-line)",
              touchAction: "none",
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Inner playfield */}
            <div className="relative h-full w-full">
              {/* Grid cells background */}
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
                const r = Math.floor(i / BOARD_SIZE);
                const c = i % BOARD_SIZE;
                return (
                  <div
                    key={`cell-${i}`}
                    style={{
                      position: "absolute",
                      left: `${c * cellPercent}%`,
                      top: `${r * cellPercent}%`,
                      width: `${cellPercent}%`,
                      height: `${cellPercent}%`,
                      padding: "2.5%",
                    }}
                  >
                    <div
                      className="h-full w-full rounded-[12%]"
                      style={{
                        background: "rgba(0,0,0,0.04)",
                      }}
                    />
                  </div>
                );
              })}

              {/* Tiles */}
              <AnimatePresence>
                {sortedTiles.map((tile) => (
                  <TileView
                    key={tile.id}
                    tile={tile}
                    cellPercent={cellPercent}
                    reduced={reduced}
                  />
                ))}
              </AnimatePresence>

              {/* Win overlay */}
              {showWin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
                  style={{
                    background: "rgba(232,174,61,0.92)",
                    color: "#3A2300",
                  }}
                >
                  <Trophy className="h-12 w-12" />
                  <p className="text-2xl font-black uppercase tracking-wide">2048!</p>
                  <p className="text-sm">Du hast es geschafft.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={keepGoing}
                      className="rounded-xl bg-[#3A2300] px-4 py-2 text-sm font-bold text-[#FFD58A] shadow-md hover:opacity-90"
                    >
                      Weiterspielen
                    </button>
                    <button
                      onClick={reset}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#3A2300] shadow-md hover:opacity-90"
                    >
                      Neu starten
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Game over overlay */}
              {showOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
                  style={{
                    background: "rgba(20,15,30,0.88)",
                    color: "#FFFFFF",
                  }}
                >
                  <p className="text-2xl font-black uppercase tracking-wide">Aus.</p>
                  <p className="text-sm opacity-80">Keine Züge mehr möglich.</p>
                  <p className="font-mono text-lg">{state.score} Punkte</p>
                  <button
                    onClick={reset}
                    className="rounded-xl px-4 py-2 text-sm font-bold shadow-md hover:opacity-90"
                    style={{ background: "var(--accent)", color: "#FFFFFF" }}
                  >
                    Nochmal
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex w-full max-w-[28rem] shrink-0 flex-col gap-2">
          {/* Reset-Button + Hint (Hint nur auf Desktop) */}
          <div className="flex items-center justify-end gap-3 sm:justify-between">
            <p className="hidden text-xs text-[var(--vibe-fg-muted)] sm:block">
              Ziel: zwei gleiche Zahlen verschmelzen zur Summe — erreiche{" "}
              <span className="font-bold text-[var(--vibe-fg-base)]">2048</span>.
            </p>
            <button
              onClick={reset}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
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

          {/* On-screen D-Pad — kompakt für mobile */}
          <div className="grid grid-cols-3 gap-1.5 sm:hidden">
            <div />
            <DPadButton onClick={() => doMove("up")} label="hoch" rotate={0} />
            <div />
            <DPadButton onClick={() => doMove("left")} label="links" rotate={-90} />
            <DPadButton onClick={() => doMove("down")} label="runter" rotate={180} />
            <DPadButton onClick={() => doMove("right")} label="rechts" rotate={90} />
          </div>
        </div>
      </div>
    </ToolShell>
  );
}

function DPadButton({
  onClick,
  label,
  rotate,
}: {
  onClick: () => void;
  label: string;
  rotate: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center rounded-xl"
      style={{
        height: "clamp(2.5rem, 11vw, 3.25rem)",
        background: "var(--accent-soft)",
        color: "var(--accent-ink)",
        boxShadow: "var(--vibe-shadow-soft)",
      }}
    >
      <ArrowUp
        className="h-5 w-5"
        style={{ transform: `rotate(${rotate}deg)` }}
      />
    </button>
  );
}
