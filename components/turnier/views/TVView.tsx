"use client";

import { useEffect, useState } from "react";
import type { TournamentDetail } from "@/components/turnier/types";
import { standingsForTournament } from "@/components/turnier/logic";

type TVViewProps = {
  tournament: TournamentDetail;
};

export function TVView({ tournament }: TVViewProps) {
  const [showStandings, setShowStandings] = useState(true);
  const standings = standingsForTournament(tournament);
  const latestRound = tournament.rounds[tournament.rounds.length - 1];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setShowStandings((prev) => !prev);
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden bg-slate-950 p-4 text-slate-100 md:gap-6 md:p-8 lg:p-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tighter md:text-4xl xl:text-5xl">{tournament.name}</h1>
        <span className="rounded-full border border-slate-600 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300 md:text-sm">
          TV Modus
        </span>
      </header>

      {showStandings ? (
        <div className="grid min-h-0 gap-2 overflow-y-auto">
          {standings.slice(0, 12).map((row) => (
            <div
              key={row.playerId}
              className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem] items-center gap-2 rounded-2xl bg-slate-900/70 p-3 md:grid-cols-[5rem_1fr_8rem_8rem_8rem] md:gap-3 md:p-4"
            >
              <span className="text-2xl font-black text-amber-300 md:text-4xl">{row.rank}</span>
              <span className="truncate text-lg font-bold md:text-3xl">{row.name}</span>
              <span className="text-base font-black text-emerald-300 md:text-2xl">S {row.wins}</span>
              <span className="text-base font-black text-red-300 md:text-2xl">N {row.losses}</span>
              <span className="text-base font-black text-sky-300 md:text-2xl">{Math.round(row.winRate * 100)}%</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-2 2xl:grid-cols-3">
          {latestRound?.matches.map((match) => (
            <div key={match.id} className="rounded-2xl bg-slate-900/70 p-4">
              <p className="mb-2 text-sm font-black uppercase tracking-[0.22em] text-slate-400">
                Match {match.matchNumber}
              </p>
              <p className="text-2xl font-bold text-sky-300">
                {match.players.filter((player) => player.team === 1).map((player) => player.name).join(" / ")}
              </p>
              <p className="my-1 text-base font-black uppercase tracking-[0.22em] text-slate-500">VS</p>
              <p className="text-2xl font-bold text-amber-300">
                {match.players.filter((player) => player.team === 2).map((player) => player.name).join(" / ")}
              </p>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-auto text-xs uppercase tracking-[0.22em] text-slate-400">
        Teilen: /tischtennis-turnier/{tournament.id}
      </footer>
    </div>
  );
}
