"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type {
  MatchEntry,
  RoundEntry,
  StandingRow,
  TournamentDetail,
} from "@/components/turnier/types";

type StandingsTableProps = {
  rows: StandingRow[];
  tournament: TournamentDetail;
  /** Spieler-Detail: nur Runden bis einschließlich dieser Nummer (wie Tabellenwerte). */
  throughRoundInclusive?: number | null;
};

type PlayerMatchEntry = {
  roundNumber: number;
  match: MatchEntry;
  team: 1 | 2;
  partners: string[];
  opponents: string[];
  result: "won" | "lost" | "open";
};

function collectPlayerMatches(
  rounds: RoundEntry[],
  playerId: string,
  throughRoundInclusive?: number | null,
): PlayerMatchEntry[] {
  const entries: PlayerMatchEntry[] = [];
  for (const round of rounds) {
    if (throughRoundInclusive != null && round.roundNumber > throughRoundInclusive) continue;
    for (const match of round.matches) {
      const me = match.players.find((player) => player.playerId === playerId);
      if (!me) continue;
      const team = me.team;
      const partners = match.players
        .filter((player) => player.team === team && player.playerId !== playerId)
        .map((player) => player.name);
      const opponents = match.players
        .filter((player) => player.team !== team)
        .map((player) => player.name);
      let result: PlayerMatchEntry["result"] = "open";
      if (match.status === "completed" && match.winnerTeam) {
        result = match.winnerTeam === team ? "won" : "lost";
      }
      entries.push({
        roundNumber: round.roundNumber,
        match,
        team,
        partners,
        opponents,
        result,
      });
    }
  }
  return entries.sort((a, b) => b.roundNumber - a.roundNumber);
}

export function StandingsTable({
  rows,
  tournament,
  throughRoundInclusive,
}: StandingsTableProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const playerMatchesById = useMemo(() => {
    const map = new Map<string, PlayerMatchEntry[]>();
    for (const row of rows) {
      map.set(
        row.playerId,
        collectPlayerMatches(tournament.rounds, row.playerId, throughRoundInclusive),
      );
    }
    return map;
  }, [rows, tournament.rounds, throughRoundInclusive]);

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid shrink-0 grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 sm:grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(6,minmax(0,1fr))]">
        <span>#</span>
        <span>Name</span>
        <span>S</span>
        <span>N</span>
        <span>Quote</span>
        <span className="hidden sm:block">Sp</span>
        <span className="hidden sm:block">Sätze</span>
        <span className="hidden sm:block">Punkte</span>
      </div>
      <div className="min-w-0">
        {rows.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Noch keine Daten – sobald die erste Runde gespielt ist, erscheint hier die Tabelle.
          </div>
        ) : null}
        {rows.map((row, index) => {
          const expanded = expandedPlayerId === row.playerId;
          const matches = playerMatchesById.get(row.playerId) ?? [];
          const rankLabel =
            index > 0 && rows[index - 1].rank === row.rank ? `=${row.rank}` : row.rank;
          return (
            <div key={row.playerId} className="border-b border-zinc-100 dark:border-zinc-800">
              <motion.button
                layout
                type="button"
                onClick={() =>
                  setExpandedPlayerId((current) => (current === row.playerId ? null : row.playerId))
                }
                className={`grid w-full grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] items-center gap-2 px-3 py-3 text-left text-sm transition-colors duration-150 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C9170]/60 dark:hover:bg-zinc-800/40 sm:grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(6,minmax(0,1fr))] ${
                  expanded ? "bg-[#DAF7E9]/70 dark:bg-[#4C9170]/10" : ""
                }`}
                aria-expanded={expanded}
              >
                <span className="font-black text-zinc-700 dark:text-zinc-200">{rankLabel}</span>
                <span
                  className={
                    row.active
                      ? "min-w-0 truncate font-semibold text-zinc-800 dark:text-zinc-100"
                      : "min-w-0 truncate text-zinc-500 line-through"
                  }
                >
                  {row.name}
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{row.wins}</span>
                <span className="text-red-500 dark:text-red-400">{row.losses}</span>
                <span className="text-zinc-700 dark:text-zinc-200">
                  {Math.round(row.winRate * 100)}%
                </span>
                <span className="hidden text-zinc-700 dark:text-zinc-200 sm:block">{row.played}</span>
                <span className="hidden text-zinc-700 dark:text-zinc-200 sm:block">
                  {row.setDiff > 0 ? `+${row.setDiff}` : row.setDiff}
                </span>
                <span className="hidden text-zinc-700 dark:text-zinc-200 sm:block">
                  {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                </span>
              </motion.button>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden bg-zinc-50/70 dark:bg-zinc-950/40"
                  >
                    <PlayerMatchList matches={matches} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayerMatchList({ matches }: { matches: PlayerMatchEntry[] }) {
  if (matches.length === 0) {
    return (
      <div className="px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400">
        Noch keine Spiele für diesen Spieler.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2 px-3 py-3 sm:px-4">
      {matches.map((entry) => (
        <li
          key={entry.match.id}
          className="flex min-w-0 flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 sm:flex-row sm:items-center sm:gap-4"
        >
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            R{entry.roundNumber} · M{entry.match.matchNumber}
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-[#1E5E3F] dark:text-[#8DC4AA]">
              {entry.partners.length ? entry.partners.join(" / ") : "Solo"}
            </span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">vs</span>
            <span className="font-semibold text-[#06331D] dark:text-[#DAF7E9]">
              {entry.opponents.join(" / ")}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {entry.match.sets.length > 0 ? (
              <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                {entry.match.sets
                  .map((set) =>
                    entry.team === 1
                      ? `${set.scoreTeam1}:${set.scoreTeam2}`
                      : `${set.scoreTeam2}:${set.scoreTeam1}`,
                  )
                  .join(" · ")}
              </span>
            ) : null}
            <ResultBadge result={entry.result} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ResultBadge({ result }: { result: PlayerMatchEntry["result"] }) {
  if (result === "won") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        Sieg
      </span>
    );
  }
  if (result === "lost") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-700 dark:bg-red-500/10 dark:text-red-300">
        Niederlage
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      Offen
    </span>
  );
}
