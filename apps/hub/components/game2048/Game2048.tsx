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

const SWIPE_THRESHOLD = 24;
const SWIPE_IGNORE_SELECTOR = "button, a, input, textarea, select, [data-no-swipe]";

/** Tile-Farbrampe 2→4096: Filzgrün (niedrig) wandert über Olive/Ocker zu Messing/Karmin (hoch). */
function tileColors(value: number): { bg: string; fg: string; shadow: string } {
  switch (value) {
    case 2:    return { bg: "#E4ECE3", fg: "#1F3A2C", shadow: "0 2px 10px -4px rgba(31,58,44,0.20)" };
    case 4:    return { bg: "#CBDBC9", fg: "#1F3A2C", shadow: "0 2px 10px -4px rgba(31,58,44,0.25)" };
    case 8:    return { bg: "#A3C2A0", fg: "#15281D", shadow: "0 3px 14px -5px rgba(31,58,44,0.35)" };
    case 16:   return { bg: "#7BA478", fg: "#FCF9EF", shadow: "0 4px 16px -6px rgba(31,58,44,0.45)" };
    case 32:   return { bg: "#5C8A57", fg: "#FCF9EF", shadow: "0 5px 18px -6px rgba(31,58,44,0.55)" };
    case 64:   return { bg: "#3F6E3B", fg: "#FCF9EF", shadow: "0 6px 22px -8px rgba(31,58,44,0.65)" };
    case 128:  return { bg: "#C7A24A", fg: "#2A1C05", shadow: "0 6px 22px -8px rgba(135,103,27,0.55)" };
    case 256:  return { bg: "#BD9237", fg: "#2A1C05", shadow: "0 7px 24px -8px rgba(135,103,27,0.60)" };
    case 512:  return { bg: "#AF8226", fg: "#FCF9EF", shadow: "0 8px 28px -10px rgba(135,103,27,0.65)" };
    case 1024: return { bg: "#9C711C", fg: "#FCF9EF", shadow: "0 9px 30px -10px rgba(135,103,27,0.70)" };
    case 2048: return { bg: "#87671B", fg: "#FCF9EF", shadow: "0 10px 32px -10px rgba(135,103,27,0.80)" };
    case 4096: return { bg: "#A23B30", fg: "#FCF9EF", shadow: "0 10px 32px -10px rgba(162,59,48,0.80)" };
    default:   return { bg: "#3A1410", fg: "#E0B45C", shadow: "0 12px 36px -10px rgba(224,180,92,0.40)" };
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
      className="flex min-w-[5rem] flex-col items-center rounded-[var(--vibe-r-lg)] px-3 py-1.5"
      style={{
        background: accent ? "var(--accent)" : "var(--vibe-bg-tinted)",
        color: accent ? "var(--vibe-bg-elevated)" : "var(--vibe-fg-base)",
        boxShadow: "var(--vibe-edge), var(--vibe-shadow-soft)",
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

  // Touch / swipe controls — window-wide, ignore interactive targets
  useEffect(() => {
    let start: { x: number; y: number } | null = null;

    function onTouchStart(e: TouchEvent) {
      const target = e.target as Element | null;
      if (target?.closest(SWIPE_IGNORE_SELECTOR)) {
        start = null;
        return;
      }
      const t = e.touches[0];
      start = { x: t.clientX, y: t.clientY };
    }
    function onTouchEnd(e: TouchEvent) {
      const s = start;
      start = null;
      if (!s) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        doMove(dx > 0 ? "right" : "left");
      } else {
        doMove(dy > 0 ? "down" : "up");
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
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
              className="font-display text-3xl font-black uppercase tracking-tight tabular-nums sm:text-4xl"
              style={{ color: "var(--accent-ink)" }}
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
            className="relative aspect-square w-full overflow-hidden rounded-[var(--vibe-r-2xl)]"
            style={{
              maxHeight: "100%",
              maxWidth: "calc(min(100vh,100%) - 0px)",
              background: "var(--tool-surface)",
              padding: "2.5%",
              boxShadow: "var(--vibe-edge), var(--vibe-shadow-lifted), inset 0 0 0 1px var(--accent-line)",
              touchAction: "none",
            }}
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
                        background: "var(--vibe-bg-sunken)",
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
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--vibe-r-2xl)]"
                  style={{
                    background: "rgba(135,103,27,0.92)",
                    color: "#2A1C05",
                  }}
                >
                  <Trophy className="h-12 w-12" />
                  <p className="font-display text-2xl font-black uppercase tracking-wide">2048!</p>
                  <p className="text-sm">Du hast es geschafft.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={keepGoing}
                      className="rounded-[var(--vibe-r-lg)] bg-[#2A1C05] px-4 py-2 text-sm font-bold text-[#E0B45C] shadow-[var(--vibe-shadow-soft)] hover:opacity-90"
                    >
                      Weiterspielen
                    </button>
                    <button
                      onClick={reset}
                      className="rounded-[var(--vibe-r-lg)] bg-[var(--vibe-bg-elevated)] px-4 py-2 text-sm font-bold text-[#2A1C05] shadow-[var(--vibe-shadow-soft)] hover:opacity-90"
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
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--vibe-r-2xl)]"
                  style={{
                    background: "rgba(11,31,23,0.88)",
                    color: "var(--vibe-bg-elevated)",
                  }}
                >
                  <p className="font-display text-2xl font-black uppercase tracking-wide">Aus.</p>
                  <p className="text-sm opacity-80">Keine Züge mehr möglich.</p>
                  <p className="font-mono text-lg">{state.score} Punkte</p>
                  <button
                    onClick={reset}
                    className="rounded-[var(--vibe-r-lg)] px-4 py-2 text-sm font-bold shadow-[var(--vibe-shadow-soft)] hover:opacity-90"
                    style={{ background: "var(--accent)", color: "var(--vibe-bg-elevated)" }}
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
              className="flex shrink-0 items-center gap-1.5 rounded-[var(--vibe-r-md)] border px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
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
      className="flex items-center justify-center rounded-[var(--vibe-r-lg)]"
      style={{
        height: "clamp(2.5rem, 11vw, 3.25rem)",
        background: "var(--accent-soft)",
        color: "var(--accent-ink)",
        boxShadow: "var(--vibe-edge), var(--vibe-shadow-soft)",
      }}
    >
      <ArrowUp
        className="h-5 w-5"
        style={{ transform: `rotate(${rotate}deg)` }}
      />
    </button>
  );
}
