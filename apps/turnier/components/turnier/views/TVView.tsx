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
    <div className="dark relative flex h-full min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden bg-[var(--vibe-bg-base)] p-4 text-[var(--vibe-fg-base)] md:gap-6 md:p-8 lg:p-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--vibe-table-light)" }}
        aria-hidden
      />
      <header className="relative flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-4xl xl:text-5xl">
          {tournament.name}
        </h1>
        <span className="rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)] md:text-sm">
          TV Modus
        </span>
      </header>

      {showStandings ? (
        <div className="relative grid min-h-0 gap-2 overflow-y-auto md:gap-3">
          {standings.slice(0, 12).map((row) => (
            <div
              key={row.playerId}
              className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem] items-center gap-2 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-3 shadow-[var(--vibe-shadow-soft)] md:grid-cols-[5rem_1fr_8rem_8rem_8rem] md:gap-3 md:p-4"
            >
              <span className="font-mono text-2xl font-bold text-[var(--accent)] md:text-4xl">{row.rank}</span>
              <span className="truncate text-lg font-semibold md:text-3xl">{row.name}</span>
              <span className="font-mono text-base font-bold text-[var(--mint)] md:text-2xl">S {row.wins}</span>
              <span className="font-mono text-base font-bold text-[var(--danger)] md:text-2xl">N {row.losses}</span>
              <span className="font-mono text-base font-bold text-[var(--vibe-fg-base)] md:text-2xl">
                {Math.round(row.winRate * 100)}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative grid min-h-0 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 2xl:grid-cols-3">
          {latestRound?.matches.map((match) => (
            <div
              key={match.id}
              className="rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-4 shadow-[var(--vibe-shadow-soft)]"
            >
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                Match {match.matchNumber}
              </p>
              <p className="text-2xl font-bold text-[var(--vibe-fg-base)]">
                {match.players.filter((player) => player.team === 1).map((player) => player.name).join(" / ")}
              </p>
              <p className="my-1 text-base font-bold uppercase tracking-[0.16em] text-[var(--vibe-fg-faint)]">VS</p>
              <p className="text-2xl font-bold text-[var(--accent)]">
                {match.players.filter((player) => player.team === 2).map((player) => player.name).join(" / ")}
              </p>
            </div>
          ))}
        </div>
      )}

      <footer className="relative mt-auto text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vibe-fg-faint)]">
        Teilen: /{tournament.id}
      </footer>
    </div>
  );
}
