"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Play, RotateCcw, Dices } from "lucide-react";
import { SumRow } from "@/components/kniffel/SumRow";
import {
  BOTTOM_CATEGORIES,
  CAT_LABELS,
  FIXED_PTS,
  TOP_CATEGORIES,
  type Category,
  type PlayerScores,
} from "@/components/kniffel/constants";
import {
  calculateTopSum,
  calculateTotal,
  createInitialScores,
} from "@/components/kniffel/helpers";
import {
  clearKniffelState,
  loadKniffelState,
  saveKniffelState,
} from "@/components/kniffel/storage";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { cn } from "@/components/ui/styles";

const ease = [0.22, 1, 0.36, 1] as const;

export default function KniffelApp() {
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [gamePlayerNames, setGamePlayerNames] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [scores, setScores] = useState<PlayerScores[]>([]);
  const isHydrated = useRef(false);

  useEffect(() => {
    const saved = loadKniffelState();
    // Nur als "gestartet" laden, wenn der State auch tatsächlich Spieler enthält.
    // Schützt vor korrupten States (isStarted:true, playerNames:[]), die sonst eine
    // leere, nicht spielbare Scorecard ergeben würden.
    if (saved && saved.isStarted && saved.playerNames.length > 0) {
      setPlayerNames(saved.playerNames);
      setGamePlayerNames(saved.playerNames);
      setScores(saved.scores);
      setIsStarted(true);
    } else if (saved && !saved.isStarted && saved.playerNames.length > 0) {
      setPlayerNames(saved.playerNames);
    }
    isHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!isHydrated.current) return;
    saveKniffelState({ playerNames: gamePlayerNames, scores, isStarted });
  }, [gamePlayerNames, scores, isStarted]);

  const initGame = () => {
    const finalizedNames = playerNames.map(
      (name, i) => name.trim() || `Spieler ${i + 1}`,
    );
    setGamePlayerNames(finalizedNames);
    setScores(createInitialScores(finalizedNames.length));
    setIsStarted(true);
  };

  const updateCell = (pIdx: number, cat: Category, val: number | null, cross = false) => {
    setScores(prev => {
      const next = [...prev];
      next[pIdx] = { ...next[pIdx], [cat]: { score: val, crossed: cross } };
      return next;
    });
  };

  const resetGame = () => {
    clearKniffelState();
    setGamePlayerNames([]);
    setScores([]);
    setIsStarted(false);
    setPlayerNames(["", ""]);
  };

  return (
    <ToolShell tool="kniffel" className="px-4 py-4 sm:px-6 sm:py-5">
      {/* Header */}
      <header className="mx-auto mb-5 flex w-full max-w-5xl shrink-0 items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--vibe-r-md)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
            <Dices size={20} className="text-[var(--accent)]" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-4xl font-black italic tracking-tight leading-none text-[var(--accent-ink)]">
              KNIFFEL
            </h1>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)] opacity-60">
              Digital Scorecard
            </p>
          </div>
        </div>
        {isStarted && (
          <button
            onClick={resetGame}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--vibe-r-md)] px-3 py-2 text-xs font-semibold",
              "text-[var(--vibe-fg-faint)] transition-colors hover:text-[var(--pasch-carmine)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pasch-carmine)]/40",
            )}
          >
            <RotateCcw size={13} aria-hidden />
            Reset
          </button>
        )}
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!isStarted ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease }}
              className="overflow-y-auto"
            >
              <div className="rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-6 shadow-[var(--vibe-shadow-soft)]">
                <h2 className="mb-5 text-lg font-semibold tracking-tight">Wer spielt mit?</h2>
                <div className="grid gap-2.5 mb-6">
                  {playerNames.map((name, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={name}
                        onChange={e => {
                          const n = [...playerNames]; n[i] = e.target.value; setPlayerNames(n);
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
                          onClick={() => setPlayerNames(playerNames.filter((_, idx) => idx !== i))}
                          className="flex h-11 w-11 items-center justify-center rounded-[var(--vibe-r-md)] text-[var(--vibe-fg-faint)] transition-colors hover:text-red-500"
                        >
                          <X size={16} aria-hidden />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setPlayerNames([...playerNames, ""])}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] transition-opacity hover:opacity-75"
                  >
                    <UserPlus size={15} aria-hidden />
                    Spieler hinzufügen
                  </button>
                </div>
                <button
                  onClick={initGame}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-[var(--vibe-r-lg)]",
                    "bg-[var(--accent)] py-3.5 text-sm font-bold text-[var(--accent-ink)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
                    "transition-all hover:brightness-95 active:scale-[0.985]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
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
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] shadow-[var(--vibe-shadow-soft)]"
            >
              <div className="overflow-auto min-h-0 flex-1">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-20">
                    <tr className="border-b border-[var(--vibe-line-brass)] bg-[var(--vibe-bg-sunken)]">
                      <th className="sticky left-0 z-30 bg-[var(--vibe-bg-sunken)] p-4 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--vibe-fg-faint)] border-r border-[var(--vibe-line-brass)]">
                        Feld
                      </th>
                      {gamePlayerNames.map((name, i) => (
                        <th key={i} className="bg-[var(--vibe-bg-sunken)] p-4 text-center min-w-[120px] text-sm font-semibold text-[var(--vibe-fg-base)]">
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--vibe-line)] text-sm">
                    {/* Top section label */}
                    <tr className="bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
                      <td colSpan={gamePlayerNames.length + 1} className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)] opacity-70">
                        Obere Sektion
                      </td>
                    </tr>
                    {TOP_CATEGORIES.map((key) => (
                      <ScoreRow
                        key={key}
                        catKey={key}
                        scores={scores}
                        onUpdate={updateCell}
                      />
                    ))}
                    <SumRow label="Oben (Summe)" players={scores} calc={calculateTopSum} />
                    <SumRow label="Bonus (+25)" players={scores} calc={s => calculateTopSum(s) >= 63 ? 25 : 0} highlight />
                    {/* Bottom section label */}
                    <tr className="bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
                      <td colSpan={gamePlayerNames.length + 1} className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)] opacity-70">
                        Untere Sektion
                      </td>
                    </tr>
                    {BOTTOM_CATEGORIES.map((key) => (
                      <ScoreRow
                        key={key}
                        catKey={key}
                        scores={scores}
                        onUpdate={updateCell}
                      />
                    ))}
                    <SumRow label="Gesamt" players={scores} calc={calculateTotal} highlight large />
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </ToolShell>
  );
}

type ScoreRowProps = {
  catKey: Category;
  scores: PlayerScores[];
  onUpdate: (pIdx: number, cat: Category, val: number | null, cross?: boolean) => void;
};

function ScoreRow({ catKey, scores, onUpdate }: ScoreRowProps) {
  return (
    <tr className="hover:bg-[var(--vibe-bg-sunken)]/50 transition-colors">
      <td className="sticky left-0 z-10 bg-[var(--vibe-bg-elevated)] p-4 text-sm font-medium text-[var(--vibe-fg-base)] border-r border-[var(--vibe-line-brass)]">
        {CAT_LABELS[catKey]}
      </td>
      {scores.map((pScore, pIdx) => (
        <td key={pIdx} className="p-2">
          <div className="flex justify-center items-center gap-1.5">
            {FIXED_PTS[catKey] ? (
              <button
                onClick={() => onUpdate(pIdx, catKey, pScore[catKey].score ? null : FIXED_PTS[catKey]!, false)}
                className={cn(
                  "flex-1 h-10 rounded-[var(--vibe-r-md)] border-2 font-bold text-sm transition-all",
                  pScore[catKey].score
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border-[var(--vibe-line-strong)] text-[var(--vibe-fg-faint)] hover:border-[var(--accent-line)]",
                )}
              >
                {pScore[catKey].score ?? FIXED_PTS[catKey]}
              </button>
            ) : (
              <input
                type="number"
                inputMode="numeric"
                value={pScore[catKey].score ?? ""}
                disabled={pScore[catKey].crossed}
                onChange={e => onUpdate(pIdx, catKey, e.target.value === "" ? null : parseInt(e.target.value))}
                className={cn(
                  "w-14 h-10 rounded-[var(--vibe-r-md)] border-2 text-center font-mono font-semibold text-sm tabular-nums",
                  "bg-[var(--vibe-bg-sunken)] border-[var(--vibe-line-strong)]",
                  "focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/25",
                  "disabled:opacity-25 transition-all",
                )}
              />
            )}
            <button
              onClick={() => onUpdate(pIdx, catKey, null, !pScore[catKey].crossed)}
              className={cn(
                "h-10 w-10 rounded-[var(--vibe-r-md)] border-2 flex items-center justify-center transition-all",
                pScore[catKey].crossed
                  ? "border-[var(--pasch-carmine)] bg-[var(--pasch-carmine-soft)] text-[var(--pasch-carmine-text)]"
                  : "border-[var(--vibe-line)] text-[var(--vibe-fg-faint)] hover:border-[var(--pasch-carmine)]/50 hover:text-[var(--pasch-carmine)]",
              )}
            >
              <X size={13} aria-hidden />
            </button>
          </div>
        </td>
      ))}
    </tr>
  );
}
