"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/components/ui/styles";
import { resolveScoring, usesMatchPoints } from "@/lib/turnier/scoring";
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
  /**
   * Alle Statspalten erzwingen, unabhängig von der Viewport-Breite. Nötig im
   * gedrehten Vollbild: Media Queries sehen dort weiterhin die schmale
   * Hochkant-Breite, obwohl der Inhalt quer über den ganzen Schirm läuft.
   */
  wide?: boolean;
};

type PlayerMatchEntry = {
  roundNumber: number;
  match: MatchEntry;
  team: 1 | 2;
  partners: string[];
  opponents: string[];
  result: "won" | "drawn" | "lost" | "open";
};

type StatColumn = {
  key: string;
  header: string;
  /** Erst ab 640px sichtbar (bzw. immer im Vollbild). */
  extra: boolean;
  className: string;
  render: (row: StandingRow) => React.ReactNode;
};

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

const COL_POINTS: StatColumn = {
  key: "points",
  header: "Pkt",
  extra: false,
  className: "font-bold text-[var(--vibe-fg-base)]",
  render: (row) => row.points,
};
const COL_WINS: StatColumn = {
  key: "wins",
  header: "S",
  extra: false,
  className: "font-bold text-[var(--ok)]",
  render: (row) => row.wins,
};
const COL_DRAWS: StatColumn = {
  key: "draws",
  header: "U",
  extra: false,
  className: "text-[var(--vibe-fg-muted)]",
  render: (row) => row.draws,
};
const COL_LOSSES: StatColumn = {
  key: "losses",
  header: "N",
  extra: false,
  className: "text-[var(--danger)]",
  render: (row) => row.losses,
};
const COL_RATE = (extra: boolean): StatColumn => ({
  key: "rate",
  header: "Quote",
  extra,
  className: "text-[var(--vibe-fg-muted)]",
  render: (row) => `${Math.round(row.winRate * 100)}%`,
});
const COL_PLAYED: StatColumn = {
  key: "played",
  header: "Sp",
  extra: true,
  className: "text-[var(--vibe-fg-muted)]",
  render: (row) => row.played,
};
const COL_SETS: StatColumn = {
  key: "sets",
  header: "Sätze",
  extra: true,
  className: "text-[var(--vibe-fg-muted)]",
  render: (row) => signed(row.setDiff),
};
// Balldifferenz. Hieß früher „Punkte" – das kollidiert mit den Match-Punkten
// der Wertung, und „Bälle" passt zum Hinweistext („Balldifferenz").
const COL_BALLS: StatColumn = {
  key: "balls",
  header: "Bälle",
  extra: true,
  className: "text-[var(--vibe-fg-muted)]",
  render: (row) => signed(row.pointDiff),
};

/**
 * Spalten hängen davon ab, ob im Turnier überhaupt Unentschieden vorkommen –
 * ohne sie bleibt die Tabelle so schmal wie zuvor. Mit Unentschieden rücken „U"
 * und (außer bei Wertung nach Siegen) die Punktespalte nach vorn; die Quote
 * wandert dafür zu den breiten Spalten.
 */
function buildColumns(showDraws: boolean, showPoints: boolean): StatColumn[] {
  if (!showDraws) {
    return [COL_WINS, COL_LOSSES, COL_RATE(false), COL_PLAYED, COL_SETS, COL_BALLS];
  }
  const leading = showPoints
    ? [COL_POINTS, COL_WINS, COL_DRAWS, COL_LOSSES]
    : [COL_WINS, COL_DRAWS, COL_LOSSES];
  return [...leading, COL_RATE(showPoints), COL_PLAYED, COL_SETS, COL_BALLS];
}

// Spalten-Layout: kompakt auf Mobile, volle Statspalten ab 640px. Bewusst sm
// statt md, damit ein quer gedrehtes Handy die zusätzlichen Spalten tatsächlich
// erreicht – darauf weist die Tabellenansicht hin. Die Klassen stehen als
// Literale da, weil Tailwind sie sonst nicht generiert.
const GRID_RESPONSIVE: Record<string, string> = {
  "3|6": "grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(3,minmax(2.5rem,1fr))_1.75rem] sm:grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(6,minmax(2.5rem,1fr))_1.75rem]",
  "4|7": "grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(4,minmax(2.25rem,1fr))_1.75rem] sm:grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(7,minmax(2.25rem,1fr))_1.75rem]",
  "4|8": "grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(4,minmax(2.25rem,1fr))_1.75rem] sm:grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(8,minmax(2.25rem,1fr))_1.75rem]",
};
const GRID_ALWAYS_WIDE: Record<number, string> = {
  6: "grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(6,minmax(2.5rem,1fr))_1.75rem]",
  7: "grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(7,minmax(2.25rem,1fr))_1.75rem]",
  8: "grid-cols-[2.5rem_minmax(0,1.4fr)_repeat(8,minmax(2.25rem,1fr))_1.75rem]",
};

// Medaillen-Tönung für Rang 1–3 (Gold/Silber/Bronze als Clay-Chip).
const MEDAL_TONE: Record<number, string> = {
  1: "bg-[var(--warn-soft)] text-[var(--warn-ink)] ring-1 ring-[var(--warn)]/40",
  2: "bg-[var(--neutral-soft)] text-[var(--neutral-ink)] ring-1 ring-[var(--vibe-line-strong)]",
  3: "bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent-line)]",
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
      if (match.status === "completed") {
        result =
          match.winnerTeam == null ? "drawn" : match.winnerTeam === team ? "won" : "lost";
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
  wide = false,
}: StandingsTableProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const extraCol = wide ? "block" : "hidden sm:block";

  const columns = useMemo(() => {
    const showDraws = rows.some((row) => row.draws > 0);
    return buildColumns(showDraws, showDraws && usesMatchPoints(resolveScoring(tournament.config)));
  }, [rows, tournament.config]);
  const baseCount = columns.filter((column) => !column.extra).length;
  const GRID_COLS = wide
    ? GRID_ALWAYS_WIDE[columns.length]
    : GRID_RESPONSIVE[`${baseCount}|${columns.length}`];

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
      <div className="flex min-w-[16rem] flex-col">
        <div
          className={`grid shrink-0 ${GRID_COLS} gap-2 border-b border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vibe-fg-faint)]`}
        >
          <span>#</span>
          <span>Name</span>
          {columns.map((column) => (
            <span key={column.key} className={column.extra ? extraCol : undefined}>
              {column.header}
            </span>
          ))}
          <span aria-hidden />
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
                  className={`grid w-full min-h-[3rem] ${GRID_COLS} items-center gap-2 px-3 py-3 text-left text-sm leading-relaxed transition-colors duration-150 [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/60 ${
                    expanded ? "bg-[var(--accent-soft)]" : ""
                  }`}
                  aria-expanded={expanded}
                >
                  {MEDAL_TONE[row.rank] ? (
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold",
                        MEDAL_TONE[row.rank],
                      )}
                    >
                      {rankLabel}
                    </span>
                  ) : (
                    <span className="font-bold text-[var(--vibe-fg-base)]">{rankLabel}</span>
                  )}
                  <span
                    className={
                      row.active
                        ? "min-w-0 truncate font-semibold text-[var(--vibe-fg-base)]"
                        : "min-w-0 truncate text-[var(--vibe-fg-faint)] line-through"
                    }
                  >
                    {row.name}
                  </span>
                  {columns.map((column) => (
                    <span
                      key={column.key}
                      className={cn(column.className, column.extra ? extraCol : undefined)}
                    >
                      {column.render(row)}
                    </span>
                  ))}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 justify-self-end text-[var(--vibe-fg-faint)] transition-transform duration-200",
                      expanded ? "rotate-180 text-[var(--accent)]" : "",
                    )}
                    strokeWidth={2.5}
                    aria-hidden
                  />
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
  if (result === "drawn") {
    return (
      <span className="rounded-full bg-[var(--warn-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--warn-ink)]">
        Unentschieden
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--neutral-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--neutral-ink)]">
      Offen
    </span>
  );
}
