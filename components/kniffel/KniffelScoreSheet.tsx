"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Play, ChevronRight, RotateCcw } from "lucide-react";
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

const ease = [0.22, 1, 0.36, 1] as const;

export default function KniffelApp() {
  const [playerNames, setPlayerNames] = useState(["Spieler 1", "Spieler 2"]);
  const [isStarted, setIsStarted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [scores, setScores] = useState<PlayerScores[]>([]);

  const initGame = () => {
    setScores(createInitialScores(playerNames.length));
    setIsStarted(true);
  };

  const updateCell = (pIdx: number, cat: Category, val: number | null, cross = false) => {
    setScores(prev => {
      const next = [...prev];
      next[pIdx] = { ...next[pIdx], [cat]: { score: val, crossed: cross } };
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans p-4 sm:p-8">
      <header className="max-w-5xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter text-amber-500 underline decoration-zinc-300 dark:decoration-zinc-700 decoration-4 underline-offset-4">
            KNIFFEL
          </h1>
          <p className="text-zinc-500 text-sm font-medium mt-2 uppercase tracking-widest">Digital Scorecard</p>
        </div>
        {isStarted && (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase transition-colors hover:text-red-600"
          >
            <RotateCcw size={14} aria-hidden />
            Reset
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {!isStarted ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800"
            >
              <h2 className="text-xl font-bold mb-4 text-center">Wer spielt mit?</h2>
              <div className="grid gap-3 mb-6">
                {playerNames.map((name, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={name}
                      onChange={e => {
                        const n = [...playerNames]; n[i] = e.target.value; setPlayerNames(n);
                      }}
                      placeholder={`Spieler ${i + 1}`}
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    {playerNames.length > 1 && (
                      <button
                        onClick={() => setPlayerNames(playerNames.filter((_, idx) => idx !== i))}
                        className="p-3 text-zinc-400 transition-colors hover:text-red-500"
                      >
                        <X size={18} aria-hidden />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setPlayerNames([...playerNames, `Spieler ${playerNames.length + 1}`])}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 transition-colors hover:text-amber-700"
                >
                  <UserPlus size={16} aria-hidden />
                  Spieler hinzufügen
                </button>
              </div>
              <button
                onClick={initGame}
                className="inline-flex w-full items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
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
              className="space-y-4"
            >
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease }}
                className="bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white text-xl">
                    {playerNames[activeIdx][0]}
                  </div>
                  <div>
                    <span className="text-[10px] block uppercase font-bold text-zinc-400">Am Zug</span>
                    <span className="font-bold">{playerNames[activeIdx]}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveIdx((activeIdx + 1) % playerNames.length)}
                  className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-6 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Nächster
                  <ChevronRight size={16} aria-hidden />
                </button>
              </motion.div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                        <th className="sticky left-0 z-20 bg-zinc-50 dark:bg-zinc-800 p-4 text-left text-[10px] uppercase tracking-widest text-zinc-400 border-r dark:border-zinc-700">Feld</th>
                        {playerNames.map((name, i) => (
                          <th key={i} className={`p-4 text-center min-w-[120px] font-bold ${activeIdx === i ? 'text-amber-500 ring-2 ring-inset ring-amber-500' : ''}`}>{name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                      {TOP_CATEGORIES.map((key) => (
                        <tr key={key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 p-4 font-bold border-r dark:border-zinc-700 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{CAT_LABELS[key]}</td>
                          {scores.map((pScore, pIdx) => (
                            <td key={pIdx} className="p-2">
                              <div className="flex justify-center items-center gap-1">
                                {FIXED_PTS[key] ? (
                                  <button 
                                    onClick={() => updateCell(pIdx, key, pScore[key].score ? null : FIXED_PTS[key]!, false)}
                                    className={`flex-1 h-10 rounded-lg border-2 font-black transition-all ${pScore[key].score ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-100 dark:border-zinc-800 text-zinc-300'}`}
                                  >
                                    {pScore[key].score || FIXED_PTS[key]}
                                  </button>
                                ) : (
                                  <input
                                    type="number" inputMode="numeric"
                                    value={pScore[key].score ?? ""}
                                    disabled={pScore[key].crossed}
                                    onChange={e => updateCell(pIdx, key, e.target.value === "" ? null : parseInt(e.target.value))}
                                    className="w-14 h-10 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-lg text-center font-bold focus:border-amber-500 outline-none disabled:opacity-20 transition-all"
                                  />
                                )}
                                <button 
                                  onClick={() => updateCell(pIdx, key, null, !pScore[key].crossed)}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${pScore[key].crossed ? 'bg-red-500 border-red-500 text-white' : 'border-zinc-100 dark:border-zinc-800 text-zinc-200 dark:text-zinc-700'}`}
                                >
                                  <X size={14} aria-hidden />
                                </button>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                      <SumRow label="Oben (Summe)" players={scores} calc={calculateTopSum} />
                      <SumRow label="Bonus (+25)" players={scores} calc={s => calculateTopSum(s) >= 63 ? 25 : 0} highlight />
                      {BOTTOM_CATEGORIES.map((key) => (
                        <tr key={key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 p-4 font-bold border-r dark:border-zinc-700 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{CAT_LABELS[key]}</td>
                          {scores.map((pScore, pIdx) => (
                            <td key={pIdx} className="p-2">
                              <div className="flex justify-center items-center gap-1">
                                {FIXED_PTS[key] ? (
                                  <button
                                    onClick={() => updateCell(pIdx, key, pScore[key].score ? null : FIXED_PTS[key]!, false)}
                                    className={`flex-1 h-10 rounded-lg border-2 font-black transition-all ${pScore[key].score ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-100 dark:border-zinc-800 text-zinc-300'}`}
                                  >
                                    {pScore[key].score || FIXED_PTS[key]}
                                  </button>
                                ) : (
                                  <input
                                    type="number" inputMode="numeric"
                                    value={pScore[key].score ?? ""}
                                    disabled={pScore[key].crossed}
                                    onChange={e => updateCell(pIdx, key, e.target.value === "" ? null : parseInt(e.target.value))}
                                    className="w-14 h-10 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-lg text-center font-bold focus:border-amber-500 outline-none disabled:opacity-20 transition-all"
                                  />
                                )}
                                <button
                                  onClick={() => updateCell(pIdx, key, null, !pScore[key].crossed)}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${pScore[key].crossed ? 'bg-red-500 border-red-500 text-white' : 'border-zinc-100 dark:border-zinc-800 text-zinc-200 dark:text-zinc-700'}`}
                                >
                                  <X size={14} aria-hidden />
                                </button>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                      <SumRow label="Gesamt" players={scores} calc={calculateTotal} highlight large />
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
