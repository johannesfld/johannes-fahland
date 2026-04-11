"use client";

import { useMemo, useState } from "react";

// --- Types & Constants ---
type Category = "ones" | "twos" | "threes" | "fours" | "fives" | "sixes" | "onePair" | "twoPairs" | "threeKind" | "fourKind" | "fullHouse" | "smallStraight" | "largeStraight" | "kniffel" | "chance";
type CellValue = { score: number | null; crossed: boolean };
type PlayerScores = Record<Category, CellValue>;

const FIXED_PTS: Partial<Record<Category, number>> = { smallStraight: 15, largeStraight: 20, kniffel: 50 };

const CAT_LABELS: Record<string, string> = {
  ones: "1er", twos: "2er", threes: "3er", fours: "4er", fives: "5er", sixes: "6er",
  onePair: "Paar", twoPairs: "2 Paare", threeKind: "3 Gleiche", fourKind: "4 Gleiche",
  fullHouse: "Full House", smallStraight: "Kl. Straße", largeStraight: "Gr. Straße",
  kniffel: "Kniffel", chance: "Chance"
};

const TOP_CATEGORIES: Category[] = ["ones", "twos", "threes", "fours", "fives", "sixes"];
const BOTTOM_CATEGORIES: Category[] = ["onePair", "twoPairs", "threeKind", "fourKind", "fullHouse", "smallStraight", "largeStraight", "kniffel", "chance"];

// --- Main Component ---
export default function KniffelApp() {
  const [playerNames, setPlayerNames] = useState(["Spieler 1", "Spieler 2"]);
  const [isStarted, setIsStarted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [scores, setScores] = useState<PlayerScores[]>([]);

  const initGame = () => {
    setScores(playerNames.map(() => 
      Object.keys(CAT_LABELS).reduce((acc, key) => ({ ...acc, [key]: { score: null, crossed: false } }), {} as PlayerScores)
    ));
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
          <button onClick={() => window.location.reload()} className="text-xs font-bold text-red-500 hover:underline uppercase">Reset</button>
        )}
      </header>

      <main className="max-w-5xl mx-auto">
        {!isStarted ? (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
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
                    <button onClick={() => setPlayerNames(playerNames.filter((_, idx) => idx !== i))} className="p-3 text-zinc-400">✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => setPlayerNames([...playerNames, `Spieler ${playerNames.length + 1}`])} className="text-sm font-bold text-amber-600">+ Spieler hinzufügen</button>
            </div>
            <button onClick={initGame} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]">SPIEL STARTEN</button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Turn Indicator */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white text-xl">
                  {playerNames[activeIdx][0]}
                </div>
                <div>
                  <span className="text-[10px] block uppercase font-bold text-zinc-400">Am Zug</span>
                  <span className="font-bold">{playerNames[activeIdx]}</span>
                </div>
              </div>
              <button onClick={() => setActiveIdx((activeIdx + 1) % playerNames.length)} className="bg-zinc-100 dark:bg-zinc-800 px-6 py-2 rounded-xl font-bold text-sm hover:bg-zinc-200">Nächster</button>
            </div>

            {/* Table */}
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
                              >✕</button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Summenzeilen */}
                    <SumRow label="Oben (Summe)" players={scores} calc={s => sum(s, ["ones","twos","threes","fours","fives","sixes"])} />
                    <SumRow label="Bonus (+25)" players={scores} calc={s => sum(s, ["ones","twos","threes","fours","fives","sixes"]) >= 63 ? 25 : 0} highlight />
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
                              >✕</button>
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
          </div>
        )}
      </main>
    </div>
  );
}

// --- Helpers ---
const sum = (s: PlayerScores, keys: string[]) => keys.reduce((a, k) => a + (s[k as Category].score ?? 0), 0);
const calculateTotal = (s: PlayerScores) => {
  const top = sum(s, ["ones","twos","threes","fours","fives","sixes"]);
  const bonus = top >= 63 ? 25 : 0;
  const bottom = sum(s, ["onePair","twoPairs","threeKind","fourKind","fullHouse","smallStraight","largeStraight","kniffel","chance"]);
  return top + bonus + bottom;
};

function SumRow({ label, players, calc, highlight, large }: { label: string, players: PlayerScores[], calc: (s: PlayerScores) => number, highlight?: boolean, large?: boolean }) {
  return (
    <tr className={`${highlight ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-zinc-50 dark:bg-zinc-800/30'}`}>
      <td className="sticky left-0 z-10 bg-inherit p-4 font-black uppercase text-[10px] tracking-widest border-r dark:border-zinc-700">{label}</td>
      {players.map((s, i) => (
        <td key={i} className={`p-4 text-center font-black ${large ? 'text-xl text-amber-500' : 'text-zinc-600 dark:text-zinc-300'}`}>{calc(s)}</td>
      ))}
    </tr>
  );
}