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

// Spalten-Layout: kompakt auf Mobile (Rang/Name/S/N/Quote),
// volle Statspalten ab md. Gemeinsames Grid-Template für Header + Zeilen.
const GRID_COLS =
  "grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(3,minmax(2.5rem,1fr))] md:grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(6,minmax(2.5rem,1fr))]";

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
    <div className="min-w-0 overflow-x-auto rounded-2xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] shadow-[var(--vibe-shadow-soft)]">
      <div className="flex min-w-[20rem] flex-col">
        <div
          className={`grid shrink-0 ${GRID_COLS} gap-2 border-b border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vibe-fg-faint)]`}
        >
          <span>#</span>
          <span>Name</span>
          <span>S</span>
          <span>N</span>
          <span>Quote</span>
          <span className="hidden md:block">Sp</span>
          <span className="hidden md:block">Sätze</span>
          <span className="hidden md:block">Punkte</span>
        </div>
        <div className="min-w-0">
          {rows.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[var(--vibe-fg-muted)]">
              Noch keine Daten – sobald die erste Runde gespielt ist, erscheint hier die Tabelle.
            </div>
          ) : null}
          {rows.map((row, index) => {
            const expanded = expandedPlayerId === row.playerId;
            const matches = playerMatchesById.get(row.playerId) ?? [];
            const rankLabel =
              index > 0 && rows[index - 1].rank === row.rank ? `=${row.rank}` : row.rank;
            return (
              <div key={row.playerId} className="border-b border-[var(--vibe-line)] last:border-b-0">
                <motion.button
                  layout
                  type="button"
                  onClick={() =>
                    setExpandedPlayerId((current) =>
                      current === row.playerId ? null : row.playerId,
                    )
                  }
                  className={`grid w-full ${GRID_COLS} items-center gap-2 px-3 py-3 text-left text-sm leading-relaxed transition-colors duration-150 [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/60 ${
                    expanded ? "bg-[var(--accent-soft)]" : ""
                  }`}
                  aria-expanded={expanded}
                >
                  <span className="font-bold text-[var(--vibe-fg-base)]">{rankLabel}</span>
                  <span
                    className={
                      row.active
                        ? "min-w-0 truncate font-semibold text-[var(--vibe-fg-base)]"
                        : "min-w-0 truncate text-[var(--vibe-fg-faint)] line-through"
                    }
                  >
                    {row.name}
                  </span>
                  <span className="font-bold text-[var(--ok)]">{row.wins}</span>
                  <span className="text-[var(--danger)]">{row.losses}</span>
                  <span className="text-[var(--vibe-fg-muted)]">
                    {Math.round(row.winRate * 100)}%
                  </span>
                  <span className="hidden text-[var(--vibe-fg-muted)] md:block">{row.played}</span>
                  <span className="hidden text-[var(--vibe-fg-muted)] md:block">
                    {row.setDiff > 0 ? `+${row.setDiff}` : row.setDiff}
                  </span>
                  <span className="hidden text-[var(--vibe-fg-muted)] md:block">
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
                      className="overflow-hidden bg-[var(--vibe-bg-sunken)]/60"
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
    </div>
  );
}

function PlayerMatchList({ matches }: { matches: PlayerMatchEntry[] }) {
  if (matches.length === 0) {
    return (
      <div className="px-4 py-4 text-xs text-[var(--vibe-fg-muted)]">
        Noch keine Spiele für diesen Spieler.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2 px-3 py-3 sm:px-4">
      {matches.map((entry) => (
        <li
          key={entry.match.id}
          className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-3 py-2 text-xs text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-flat)] sm:flex-row sm:items-center sm:gap-4"
        >
          <span className="shrink-0 rounded-full bg-[var(--vibe-bg-sunken)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
            R{entry.roundNumber} · M{entry.match.matchNumber}
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-[var(--vibe-fg-base)]">
              {entry.partners.length ? entry.partners.join(" / ") : "Solo"}
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
              vs
            </span>
            <span className="font-semibold text-[var(--vibe-fg-base)]">
              {entry.opponents.join(" / ")}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {entry.match.sets.length > 0 ? (
              <span className="font-mono text-[11px] text-[var(--vibe-fg-muted)]">
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
      <span className="rounded-full bg-[var(--ok-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ok-ink)]">
        Sieg
      </span>
    );
  }
  if (result === "lost") {
    return (
      <span className="rounded-full bg-[var(--danger-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--danger-ink)]">
        Niederlage
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--neutral-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--neutral-ink)]">
      Offen
    </span>
  );
}
