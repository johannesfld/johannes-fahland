"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type Stage = "setup" | "bids" | "actuals" | "finished";

type GameState = {
  stage: Stage;
  players: Player[];
  totalRounds: number;
  roundNumber: number;
  pendingBids: number[];
  pendingActuals: number[];
};

const STORAGE_KEY = "wizard-pro-score-v1";

// --- Hilfsfunktionen ---
const getRoundCount = (players: number) => Math.floor(60 / players);

const calculatePoints = (bid: number, actual: number) => {
  if (bid === actual) {
    return 20 + actual * 10;
  }
  return -Math.abs(bid - actual) * 10;
};

const INITIAL_STATE: GameState = {
  stage: "setup",
  players: [],
  totalRounds: 0,
  roundNumber: 1,
  pendingBids: [],
  pendingActuals: [],
};

export default function WizardScoreMaster() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [setupPlayerCount, setSetupPlayerCount] = useState(4);
  const [setupNames, setSetupNames] = useState<string[]>(["Narr", "Zauberer", "Riese", "Zwerg", "Elf", "Troll"]);
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

  // --- Handlers ---
  const handleStartGame = () => {
    setError(null);
    const names = setupNames.slice(0, setupPlayerCount).map((n, i) => n.trim() || `Seher ${i + 1}`);
    
    setState({
      stage: "bids",
      players: names.map(name => ({ name, totalScore: 0, history: [] })),
      totalRounds: getRoundCount(setupPlayerCount),
      roundNumber: 1,
      pendingBids: new Array(setupPlayerCount).fill(0),
      pendingActuals: new Array(setupPlayerCount).fill(0),
    });
  };

  const handleNextStage = () => {
    setError(null);

    if (state.stage === "bids") {
      const sumBids = state.pendingBids.reduce((a, b) => a + b, 0);
      // Wizard Regel: Summe der Ansagen darf nicht gleich der Rundenzahl sein
      if (sumBids === state.roundNumber) {
        setError(`Die Summe der Ansagen darf nicht ${state.roundNumber} sein!`);
        return;
      }
      setState(prev => ({ ...prev, stage: "actuals" }));
    } 
    
    else if (state.stage === "actuals") {
      const sumActuals = state.pendingActuals.reduce((a, b) => a + b, 0);
      if (sumActuals !== state.roundNumber) {
        setError(`Die Summe der Stiche muss genau ${state.roundNumber} ergeben!`);
        return;
      }

      const updatedPlayers = state.players.map((p, i) => {
        const points = calculatePoints(state.pendingBids[i], state.pendingActuals[i]);
        return {
          ...p,
          totalScore: p.totalScore + points,
          history: [...p.history, {
            roundNumber: state.roundNumber,
            bid: state.pendingBids[i],
            actual: state.pendingActuals[i],
            points
          }]
        };
      });

      const nextRound = state.roundNumber + 1;
      const isFinished = state.roundNumber >= state.totalRounds;

      setState(prev => ({
        ...prev,
        players: updatedPlayers,
        stage: isFinished ? "finished" : "bids",
        roundNumber: isFinished ? prev.roundNumber : nextRound,
        pendingBids: new Array(prev.players.length).fill(0),
        pendingActuals: new Array(prev.players.length).fill(0),
      }));
    }
  };

  const resetGame = () => {
    if (confirm("Möchtest du das aktuelle Spiel wirklich beenden?")) {
      localStorage.removeItem(STORAGE_KEY);
      setState(INITIAL_STATE);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-amber-50 font-sans p-4 pb-12 selection:bg-amber-500/30">
      {/* Mystischer Hintergrund-Effekt */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] pointer-events-none" />

      <div className="relative max-w-xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="text-center py-6">
          <h1 className="text-5xl font-serif font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
            WIZARD
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-amber-500/60 mt-2 font-bold">
            Score Master Pro
          </p>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-500/50 text-red-200 p-4 rounded-2xl text-sm text-center animate-in fade-in zoom-in duration-300">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        {/* --- SETUP STAGE --- */}
        {state.stage === "setup" && (
          <div className="space-y-8 bg-slate-900/40 border border-amber-900/20 p-8 rounded-[2rem] backdrop-blur-xl shadow-2xl">
            <div className="space-y-4">
              <label className="block text-center">
                <span className="text-xs uppercase text-amber-500/60 font-black tracking-widest">Anzahl der Spieler</span>
                <div className="flex justify-center gap-2 mt-4">
                  {[3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => setSetupPlayerCount(n)}
                      className={`w-12 h-12 rounded-full border-2 transition-all font-serif text-lg ${
                        setupPlayerCount === n 
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </label>

              <div className="space-y-3 mt-8">
                <span className="text-xs uppercase text-amber-500/60 font-black tracking-widest block text-center mb-4">Namen der Seher</span>
                {Array.from({ length: setupPlayerCount }).map((_, i) => (
                  <input
                    key={i}
                    value={setupNames[i] || ""}
                    onChange={(e) => {
                      const newNames = [...setupNames];
                      newNames[i] = e.target.value;
                      setSetupNames(newNames);
                    }}
                    placeholder={`Spieler ${i + 1}`}
                    className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500/50 transition-all text-center placeholder:text-slate-600"
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={handleStartGame}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-transform uppercase tracking-widest"
            >
              Ritual beginnen
            </button>
          </div>
        )}

        {/* --- GAME STAGE (BIDS & ACTUALS) --- */}
        {(state.stage === "bids" || state.stage === "actuals") && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 border border-amber-900/20 px-6 py-4 rounded-2xl backdrop-blur-md">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Aktuelle Runde</p>
                <p className="text-2xl font-serif font-bold text-amber-200">{state.roundNumber} <span className="text-sm text-amber-500/40">/ {state.totalRounds}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Phase</p>
                <p className="text-sm font-bold text-amber-400 uppercase tracking-tighter">
                  {state.stage === "bids" ? "Die Vorhersage" : "Die Abrechnung"}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {state.players.map((p, i) => (
                <div key={i} className="group bg-slate-900/40 border border-slate-800 hover:border-amber-500/30 rounded-3xl p-5 flex items-center justify-between transition-all">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-amber-50 truncate">{p.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Gesamt: {p.totalScore} Pkt.</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {state.stage === "actuals" && (
                      <div className="text-center px-4 py-1 bg-amber-500/5 rounded-lg border border-amber-500/10">
                        <p className="text-[9px] uppercase text-amber-500/50 font-bold">Ziel</p>
                        <p className="text-xl font-serif text-amber-500/80">{state.pendingBids[i]}</p>
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={state.stage === "bids" ? state.pendingBids[i] : state.pendingActuals[i]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const next = state.stage === "bids" ? [...state.pendingBids] : [...state.pendingActuals];
                          next[i] = val;
                          setState(s => ({ ...s, [state.stage === "bids" ? "pendingBids" : "pendingActuals"]: next }));
                        }}
                        className="w-20 bg-slate-950 border-2 border-slate-800 rounded-2xl py-3 text-center text-2xl font-serif text-amber-400 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleNextStage}
              className="w-full bg-amber-500 text-slate-950 font-black py-5 rounded-3xl shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-sm"
            >
              {state.stage === "bids" ? "Prophezeiung besiegeln" : "Runde abschließen"}
            </button>
          </div>
        )}

        {/* --- FINISHED STAGE --- */}
        {state.stage === "finished" && (
          <div className="text-center space-y-8 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-amber-200">Das Schicksal ist besiegelt!</h2>
              <p className="text-slate-400">Der mächtigste Magier der Runde ist...</p>
            </div>
            
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-slate-900 border-2 border-amber-400 p-8 rounded-[2.5rem] shadow-2xl">
                <p className="text-5xl font-serif font-black text-amber-400 mb-2">{leaderboard[0].name}</p>
                <p className="text-amber-500/60 uppercase tracking-widest font-bold text-sm">{leaderboard[0].totalScore} Punkte</p>
              </div>
            </div>

            <button 
              onClick={resetGame}
              className="block w-full text-slate-500 hover:text-amber-400 transition-colors uppercase text-xs font-bold tracking-[0.3em] pt-8"
            >
              Ein neues Zeitalter beginnen
            </button>
          </div>
        )}

        {/* --- DASHBOARD / SCOREBOARD --- */}
        {state.stage !== "setup" && (
          <section className="space-y-4 pt-6">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/30 whitespace-nowrap">Rangliste der Seher</span>
              <div className="h-px w-full bg-gradient-to-r from-amber-500/20 to-transparent" />
            </div>

            <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-2 py-4">Seher</th>
                    <th className="px-6 py-4 text-right">Punkte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {leaderboard.map((p, i) => (
                    <tr key={i} className={`transition-colors ${i === 0 ? 'bg-amber-500/[0.03]' : ''}`}>
                      <td className="px-6 py-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          i === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-2 py-4 font-bold text-amber-100/90">{p.name}</td>
                      <td className="px-6 py-4 text-right font-serif font-bold text-amber-400">{p.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* History Accordion */}
            <div className="mt-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/30 mb-4 px-2">Vergangene Visionen</h3>
              <div className="grid gap-2">
                {state.players.map((p, idx) => (
                  <details key={idx} className="group bg-slate-950/20 border border-slate-900 rounded-2xl transition-all">
                    <summary className="list-none p-4 cursor-pointer flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-400 group-open:text-amber-400">{p.name}</span>
                      <span className="text-[10px] text-slate-600 uppercase font-bold">{p.history.length} Runden</span>
                    </summary>
                    <div className="p-4 pt-0 grid gap-2">
                      {[...p.history].reverse().map((r, ri) => (
                        <div key={ri} className="flex justify-between items-center text-xs bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-500 font-bold">R{r.roundNumber}</span>
                          <span className="text-slate-400 italic">Ansage {r.bid} → {r.actual} Stiche</span>
                          <span className={`font-serif font-bold ${r.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {r.points >= 0 ? `+${r.points}` : r.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {state.stage !== "finished" && (
              <button 
                onClick={resetGame}
                className="w-full py-8 text-slate-600 hover:text-red-500 transition-colors uppercase text-[9px] font-black tracking-[0.4em]"
              >
                Ritual abbrechen
              </button>
            )}
          </section>
        )}
      </div>

      <style jsx global>{`
        /* Remove arrows from number inputs */
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