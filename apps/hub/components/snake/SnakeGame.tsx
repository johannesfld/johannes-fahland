"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Play, Pause, ArrowUp } from "lucide-react";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { applyDir, createInitialState, tick } from "./logic";
import { loadBest, saveBest } from "./storage";
import { GRID, TICK_MS, type Dir, type GameState } from "./types";

const SWIPE_THRESHOLD = 24;
const SWIPE_IGNORE_SELECTOR = "button, a, input, textarea, select, [data-no-swipe]";

const OPPOSITE: Record<Dir, Dir> = {
  up: "down", down: "up", left: "right", right: "left",
};

export default function SnakeGame() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [best, setBest] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Hydrate best score
  useEffect(() => {
    setBest(loadBest());
  }, []);

  // Persist best on game over
  useEffect(() => {
    if (state.status === "over") {
      saveBest(state.score);
      setBest((prev) => Math.max(prev, state.score));
    }
  }, [state.status, state.score]);

  const stopTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    intervalRef.current = setInterval(() => {
      setState((s) => tick(s));
    }, TICK_MS);
  }, [stopTick]);

  const startGame = useCallback(() => {
    setState((s) => {
      const next = s.status === "idle" || s.status === "over"
        ? { ...createInitialState(), status: "running" as const }
        : { ...s, status: "running" as const };
      return next;
    });
    startTick();
  }, [startTick]);

  const togglePause = useCallback(() => {
    setState((s) => {
      if (s.status === "running") {
        stopTick();
        return { ...s, status: "paused" };
      }
      if (s.status === "paused") {
        startTick();
        return { ...s, status: "running" };
      }
      return s;
    });
  }, [startTick, stopTick]);

  const reset = useCallback(() => {
    stopTick();
    setState(createInitialState());
  }, [stopTick]);

  // Stop ticker when over
  useEffect(() => {
    if (state.status === "over") stopTick();
  }, [state.status, stopTick]);

  // Cleanup on unmount
  useEffect(() => () => stopTick(), [stopTick]);

  const changeDir = useCallback((dir: Dir) => {
    let didTurn = false;
    setState((s) => {
      if (s.status !== "running") return s;
      const newNext = applyDir(s.dir, dir);
      if (newNext === s.dir) return { ...s, nextDir: newNext };
      // Real direction change → step immediately so the snake feels responsive.
      didTurn = true;
      return tick({ ...s, nextDir: newNext });
    });
    if (didTurn) startTick();
  }, [startTick]);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, Dir> = {
        ArrowUp: "up", w: "up", W: "up",
        ArrowDown: "down", s: "down", S: "down",
        ArrowLeft: "left", a: "left", A: "left",
        ArrowRight: "right", d: "right", D: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        if (stateRef.current.status === "idle" || stateRef.current.status === "over") {
          startGame();
        } else {
          changeDir(dir);
        }
      }
      if (e.key === " " || e.key === "Escape") {
        e.preventDefault();
        if (stateRef.current.status === "idle" || stateRef.current.status === "over") {
          startGame();
        } else {
          togglePause();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startGame, changeDir, togglePause]);

  // Touch / swipe — window-wide, ignore interactive targets
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
      const dir: Dir = Math.abs(dx) > Math.abs(dy)
        ? dx > 0 ? "right" : "left"
        : dy > 0 ? "down" : "up";
      if (stateRef.current.status === "idle" || stateRef.current.status === "over") {
        startGame();
      } else {
        changeDir(dir);
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [startGame, changeDir]);

  const cellSize = 100 / GRID;

  return (
    <ToolShell tool="snake" fullBleed>
      <div className="flex h-full w-full flex-col items-center justify-start gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-[calc(0.5rem+64px+env(safe-area-inset-bottom,0px))] sm:gap-4 sm:px-4 sm:py-6 sm:pb-6">
        {/* Header */}
        <div className="flex w-full max-w-[28rem] shrink-0 items-center justify-between gap-3">
          <div className="flex flex-col leading-none">
            <span
              className="font-sans text-3xl font-black uppercase tracking-tight sm:text-4xl"
              style={{ color: "var(--accent)" }}
            >
              SNAKE
            </span>
            <span className="mt-0.5 hidden text-xs text-[var(--vibe-fg-muted)] sm:block">
              {state.status === "idle"
                ? "Tippen zum Starten"
                : state.status === "over"
                ? "Game Over"
                : state.status === "paused"
                ? "Pausiert"
                : "Wische oder Pfeiltasten"}
            </span>
          </div>
          <div className="flex items-stretch gap-2">
            <ScoreCard label="Punkte" value={state.score} accent />
            <ScoreCard label="Best" value={best} />
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
              boxShadow: "var(--vibe-shadow-lifted), inset 0 0 0 1px var(--accent-line)",
              touchAction: "none",
            }}
            onClick={() => {
              if (state.status === "idle" || state.status === "over") startGame();
            }}
          >
            {/* Grid dots */}
            <svg
              className="absolute inset-0 h-full w-full"
              aria-hidden
              style={{ opacity: 0.04 }}
            >
              {Array.from({ length: GRID - 1 }).map((_, r) =>
                Array.from({ length: GRID - 1 }).map((_, c) => (
                  <circle
                    key={`${r}-${c}`}
                    cx={`${(c + 1) * cellSize}%`}
                    cy={`${(r + 1) * cellSize}%`}
                    r="1"
                    fill="var(--accent)"
                  />
                ))
              )}
            </svg>

            {/* Food */}
            <div
              className="absolute rounded-full"
              style={{
                left: `${state.food.x * cellSize + cellSize * 0.15}%`,
                top: `${state.food.y * cellSize + cellSize * 0.15}%`,
                width: `${cellSize * 0.7}%`,
                height: `${cellSize * 0.7}%`,
                background: "var(--accent)",
                boxShadow: "0 0 8px 2px var(--accent)",
                borderRadius: "50%",
              }}
            />

            {/* Snake */}
            {state.snake.map((seg, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${seg.x * cellSize + cellSize * 0.08}%`,
                  top: `${seg.y * cellSize + cellSize * 0.08}%`,
                  width: `${cellSize * 0.84}%`,
                  height: `${cellSize * 0.84}%`,
                  background: i === 0 ? "var(--accent)" : "var(--accent-soft)",
                  borderRadius: i === 0 ? "35%" : "30%",
                  opacity: i === 0 ? 1 : Math.max(0.45, 1 - i * 0.03),
                  outline: i === 0 ? "2px solid var(--accent)" : undefined,
                  outlineOffset: i === 0 ? "1px" : undefined,
                }}
              />
            ))}

            {/* Idle overlay */}
            {state.status === "idle" && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
                style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
              >
                <Play className="h-12 w-12" style={{ color: "var(--accent)" }} />
                <p className="text-lg font-bold uppercase tracking-wide">Start</p>
                <p className="text-xs opacity-70">Tippen oder Pfeiltaste</p>
              </div>
            )}

            {/* Paused overlay */}
            {state.status === "paused" && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
                style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
              >
                <Pause className="h-10 w-10" style={{ color: "var(--accent)" }} />
                <p className="text-lg font-bold uppercase tracking-wide">Pause</p>
                <button
                  onClick={(e) => { e.stopPropagation(); togglePause(); }}
                  className="rounded-xl px-5 py-2 text-sm font-bold shadow-md"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Weiter
                </button>
              </div>
            )}

            {/* Game over overlay */}
            {state.status === "over" && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
                style={{ background: "rgba(15,10,20,0.88)", color: "#fff" }}
              >
                <p className="text-2xl font-black uppercase tracking-wide">Aus.</p>
                <p className="font-mono text-lg">{state.score} Punkte</p>
                <button
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="rounded-xl px-5 py-2 text-sm font-bold shadow-md"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Nochmal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex w-full max-w-[28rem] shrink-0 flex-col gap-2">
          <div className="flex items-center justify-end gap-2 sm:justify-between">
            <p className="hidden text-xs text-[var(--vibe-fg-muted)] sm:block">
              Friss die&nbsp;
              <span className="font-bold" style={{ color: "var(--accent)" }}>●</span>
              &nbsp;ohne dich selbst zu treffen.
            </p>
            <div className="flex gap-2">
              {state.status === "running" || state.status === "paused" ? (
                <button
                  onClick={togglePause}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                  style={{
                    borderColor: "var(--accent-line)",
                    color: "var(--accent-ink)",
                    background: "var(--accent-soft)",
                  }}
                >
                  {state.status === "paused" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  {state.status === "paused" ? "Weiter" : "Pause"}
                </button>
              ) : null}
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
          </div>

          {/* D-Pad (mobile) */}
          <div className="grid grid-cols-3 gap-1.5 sm:hidden">
            <div />
            <DPadButton onClick={() => changeDir("up")} label="hoch" rotate={0} />
            <div />
            <DPadButton onClick={() => changeDir("left")} label="links" rotate={-90} />
            <DPadButton onClick={() => changeDir("down")} label="runter" rotate={180} />
            <DPadButton onClick={() => changeDir("right")} label="rechts" rotate={90} />
          </div>
        </div>
      </div>
    </ToolShell>
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

function DPadButton({ onClick, label, rotate }: { onClick: () => void; label: string; rotate: number }) {
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
      <ArrowUp className="h-5 w-5" style={{ transform: `rotate(${rotate}deg)` }} />
    </button>
  );
}
