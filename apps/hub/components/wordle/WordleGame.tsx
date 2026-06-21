"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import {
  addLetter,
  clearShake,
  createInitialState,
  deleteLetter,
  getDailyWord,
  getKeyboardState,
  submitGuess,
} from "./logic";
import { loadTodayState, saveTodayState } from "./storage";
import type { GameState, LetterState } from "./types";
import { MAX_GUESSES, WORD_LENGTH } from "./types";

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Z","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Y","X","C","V","B","N","M","⌫"],
];

/* Wordle-Sonderfall (A6): dedizierte State-Farben, NIE Brand-Filzgrün oder Messing
   als Letter-State — sonst Kollision mit Tool-Akzent/Markenfarbe. */
const STATE_COLORS: Record<LetterState, { bg: string; fg: string; border: string }> = {
  correct: { bg: "#2E7D44", fg: "#FCF9EF",   border: "#2E7D44" },
  present: { bg: "#92660F", fg: "#FCF9EF",   border: "#92660F" },
  absent:  { bg: "#8A8378", fg: "#FCF9EF",   border: "#8A8378" },
  empty:   { bg: "transparent", fg: "var(--vibe-fg-base)", border: "var(--vibe-line-strong)" },
  active:  { bg: "transparent", fg: "var(--vibe-fg-base)", border: "var(--accent)" },
};

const DARK_STATE_COLORS: Record<LetterState, { bg: string; fg: string; border: string }> = {
  correct: { bg: "#7CC08C", fg: "#0B1F17",   border: "#7CC08C" },
  present: { bg: "#E0B45C", fg: "#2A1C05",   border: "#E0B45C" },
  absent:  { bg: "#4A5650", fg: "#C3BBA4",   border: "#4A5650" },
  empty:   { bg: "transparent", fg: "var(--vibe-fg-base)", border: "var(--vibe-line-strong)" },
  active:  { bg: "transparent", fg: "var(--vibe-fg-base)", border: "var(--accent)" },
};

function getRandomWord(words: string[], exclude?: string): string {
  let word = exclude;
  while (word === exclude) {
    word = words[Math.floor(Math.random() * words.length)];
  }
  return word!;
}

/**
 * Animierbare „transparente" Variante einer Zielfarbe. framer-motion kann nicht von
 * "transparent" interpolieren — eine alpha-0-Version derselben Farbe verhindert die
 * Warnung und lässt den Hintergrund sauber zur Zielfarbe ausfaden. */
function fadeFrom(color: string): string {
  const hex = color.trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (m) {
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0)`;
  }
  // Nicht-Hex (z.B. CSS-Variable) → unsichtbares Grau als sicherer Startwert.
  return "rgba(127, 127, 127, 0)";
}

export default function WordleGame({ words, accepted }: { words: string[]; accepted: string[] }) {
  const acceptedSet = useMemo(() => new Set(accepted), [accepted]);
  const dailyWord = getDailyWord(words);
  const [state, setState] = useState<GameState>(() => createInitialState(dailyWord));
  const [hydrated, setHydrated] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isDaily, setIsDaily] = useState(true);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect dark mode
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Hydrate from localStorage (daily only)
  useEffect(() => {
    const saved = loadTodayState();
    if (saved) {
      setState((s) => ({
        ...s,
        guesses: saved.guesses,
        currentRow: saved.currentRow,
        currentInput: saved.currentInput,
        status: saved.status,
        message: saved.status === "lost"
          ? `Lösung: ${s.answer}`
          : saved.status === "won"
          ? "🎉 Schon gelöst!"
          : "",
      }));
    }
    setHydrated(true);
  }, []);

  // Persist on every state change (daily only)
  useEffect(() => {
    if (!hydrated || !isDaily) return;
    saveTodayState(state);
  }, [state, hydrated, isDaily]);

  // Clear shake after animation
  useEffect(() => {
    if (!state.shake) return;
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => {
      setState((s) => clearShake(s));
    }, 500);
    return () => { if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current); };
  }, [state.shake]);

  const handleKey = useCallback((key: string) => {
    if (key === "ENTER") {
      setState((s) => submitGuess(s, acceptedSet));
    } else if (key === "⌫" || key === "BACKSPACE") {
      setState((s) => deleteLetter(s));
    } else if (/^[A-Za-z]$/.test(key)) {
      setState((s) => addLetter(s, key.toUpperCase()));
    }
  }, [acceptedSet]);

  // Keyboard input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") handleKey("ENTER");
      else if (e.key === "Backspace") handleKey("⌫");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleKey]);

  const startNewGame = useCallback(() => {
    const word = getRandomWord(words, state.answer);
    setState(createInitialState(word));
    setIsDaily(false);
  }, [words, state.answer]);

  const returnToDaily = useCallback(() => {
    const saved = loadTodayState();
    if (saved) {
      setState((s) => ({
        ...createInitialState(dailyWord),
        guesses: saved.guesses,
        currentRow: saved.currentRow,
        currentInput: saved.currentInput,
        status: saved.status,
        message: saved.status === "lost"
          ? `Lösung: ${dailyWord}`
          : saved.status === "won"
          ? "🎉 Schon gelöst!"
          : "",
      }));
    } else {
      setState(createInitialState(dailyWord));
    }
    setIsDaily(true);
  }, [dailyWord]);

  const colors = isDark ? DARK_STATE_COLORS : STATE_COLORS;
  const keyboardState = getKeyboardState(state.guesses);

  // Build display grid
  const displayRows = state.guesses.map((row, rowIdx) => {
    if (rowIdx < state.currentRow) return row;
    if (rowIdx === state.currentRow && state.status === "playing") {
      return Array.from({ length: WORD_LENGTH }, (_, i) => ({
        char: state.currentInput[i] ?? "",
        state: (state.currentInput[i] ? "active" : "empty") as LetterState,
      }));
    }
    return row;
  });

  return (
    <ToolShell tool="wordle">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-2 py-3 sm:px-3 sm:py-4">
        {/* Header */}
        <div className="flex w-full max-w-sm items-center justify-between mb-1">
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl" style={{ color: "var(--accent-ink)" }}>
              WORDLE
            </span>
            <span
              className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]"
              suppressHydrationWarning
            >
              {hydrated
                ? isDaily
                  ? `Tageswort · ${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}`
                  : "Freies Spiel"
                : "Tageswort"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
              {state.currentRow} / {MAX_GUESSES}
            </span>
            <button
              onClick={startNewGame}
              className="flex items-center gap-1 rounded-[var(--vibe-r-md)] border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors"
              style={{
                borderColor: "var(--accent-line)",
                color: "var(--accent-ink)",
                background: "var(--accent-soft)",
              }}
              title="Neues zufälliges Wort"
            >
              <RotateCcw className="h-3 w-3" />
              Neu
            </button>
          </div>
        </div>

        {/* Daily / Free toggle hint */}
        {!isDaily && (
          <button
            onClick={returnToDaily}
            className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vibe-fg-faint)] underline underline-offset-2 hover:text-[var(--vibe-fg-muted)]"
          >
            ← Zurück zum Tageswort
          </button>
        )}

        {/* Board */}
        <motion.div
          className="grid w-full max-w-[17rem] gap-1 sm:max-w-[20rem] sm:gap-1.5"
          style={{ gridTemplateRows: `repeat(${MAX_GUESSES}, 1fr)` }}
          animate={state.shake ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          {displayRows.map((row, rowIdx) => (
            <div key={rowIdx} className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${WORD_LENGTH}, 1fr)` }}>
              {row.map((cell, colIdx) => {
                const c = colors[cell.state];
                const isRevealing = rowIdx < state.currentRow;
                return (
                  <motion.div
                    key={colIdx}
                    initial={false}
                    animate={isRevealing && hydrated ? {
                      rotateX: [0, -90, 0],
                      backgroundColor: [fadeFrom(c.bg), fadeFrom(c.bg), c.bg],
                    } : { backgroundColor: c.bg }}
                    transition={{
                      duration: isRevealing ? 0.5 : 0.12,
                      delay: isRevealing ? colIdx * 0.1 : 0,
                      ease: "easeInOut",
                    }}
                    className="flex aspect-square items-center justify-center rounded-[var(--vibe-r-md)] text-lg font-black uppercase sm:text-xl"
                    style={{
                      color: c.fg,
                      border: `2px solid ${c.border}`,
                      transformOrigin: "center",
                    }}
                  >
                    {cell.char}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </motion.div>

        {/* Keyboard */}
        <div className="mt-2 flex w-full flex-col gap-[3px] px-1 sm:gap-1.5 sm:px-2 sm:pt-1" style={{ maxWidth: "min(384px, 100vw - 8px)" }}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex w-full justify-center gap-[2px] sm:gap-[3px]">
              {row.map((key) => {
                const ks = keyboardState[key];
                const kc = ks ? colors[ks] : null;
                const isWide = key === "ENTER" || key === "⌫";
                return (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className="flex min-w-0 items-center justify-center rounded-[var(--vibe-r-sm)] font-bold uppercase transition-transform active:scale-95 sm:rounded-[var(--vibe-r-md)]"
                    style={{
                      height: "2.4rem",
                      flex: isWide ? "1.5 1 0" : "1 1 0",
                      minWidth: 0,
                      background: kc ? kc.bg : "var(--vibe-bg-sunken)",
                      color: kc ? kc.fg : "var(--vibe-fg-base)",
                      border: kc ? `1.5px solid ${kc.border}` : "1.5px solid var(--vibe-line)",
                      fontSize: isWide ? "0.5rem" : "0.7rem",
                    }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Message slot — fixed height so the board doesn't shift */}
        <div className="mt-2 flex h-8 w-full max-w-sm items-center justify-center px-2">
          <AnimatePresence mode="wait">
            {state.message && (
              <motion.div
                key={state.message}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-[var(--vibe-r-md)] px-4 py-1 text-sm font-bold"
                style={{
                  background: state.status === "won" ? "var(--accent)" : "var(--vibe-bg-elevated)",
                  color: state.status === "won" ? "var(--vibe-bg-elevated)" : "var(--vibe-fg-base)",
                  boxShadow: "var(--vibe-edge), var(--vibe-shadow-soft)",
                }}
              >
                {state.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ToolShell>
  );
}
