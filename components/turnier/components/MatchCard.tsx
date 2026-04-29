import type { MatchEntry, MatchStatus } from "@/components/turnier/types";
import { turnierCard } from "@/components/turnier/styles";

type MatchCardProps = {
  match: MatchEntry;
  children?: React.ReactNode;
};

const STATUS_LABEL: Record<MatchStatus, string> = {
  pending: "Offen",
  playing: "Läuft",
  completed: "Fertig",
};

const STATUS_TONE: Record<MatchStatus, string> = {
  pending:
    "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
  playing:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300",
  completed:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export function MatchCard({ match, children }: MatchCardProps) {
  const team1 = match.players.filter((player) => player.team === 1);
  const team2 = match.players.filter((player) => player.team === 2);
  const isCompleted = match.status === "completed";
  const team1Wins = match.winnerTeam === 1;
  const team2Wins = match.winnerTeam === 2;

  const team1ToneBase =
    "min-w-0 break-words rounded-xl p-3 text-sm font-semibold transition-colors duration-200 sm:text-base";
  const team1Tone = isCompleted
    ? team1Wins
      ? "bg-sky-100 text-sky-900 ring-2 ring-emerald-500/60 dark:bg-sky-950/40 dark:text-sky-200"
      : "bg-sky-50/60 text-sky-800/70 opacity-70 dark:bg-sky-950/20 dark:text-sky-300/70"
    : "bg-sky-50 text-sky-800 dark:bg-sky-950/30 dark:text-sky-300";
  const team2ToneBase = team1ToneBase;
  const team2Tone = isCompleted
    ? team2Wins
      ? "bg-amber-100 text-amber-900 ring-2 ring-emerald-500/60 dark:bg-amber-950/40 dark:text-amber-200"
      : "bg-amber-50/60 text-amber-800/70 opacity-70 dark:bg-amber-950/20 dark:text-amber-300/70"
    : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300";

  return (
    <article className={`${turnierCard} flex min-w-0 flex-col gap-3`}>
      <header className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
          Match {match.matchNumber}
        </p>
        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${STATUS_TONE[match.status]}`}
        >
          {STATUS_LABEL[match.status]}
        </span>
      </header>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <div className={`${team1ToneBase} ${team1Tone}`}>
          {team1.map((player) => player.name).join(" / ") || "–"}
        </div>
        <span className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
          vs
        </span>
        <div className={`${team2ToneBase} ${team2Tone}`}>
          {team2.map((player) => player.name).join(" / ") || "–"}
        </div>
      </div>

      {match.sets.length > 0 ? (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {match.sets.map((setEntry) => {
            const team1Won = setEntry.scoreTeam1 > setEntry.scoreTeam2;
            const team2Won = setEntry.scoreTeam2 > setEntry.scoreTeam1;
            return (
              <span
                key={setEntry.setNumber}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300"
              >
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  S{setEntry.setNumber}
                </span>
                <span className={team1Won ? "font-black text-sky-700 dark:text-sky-300" : ""}>
                  {setEntry.scoreTeam1}
                </span>
                <span className="text-zinc-400">:</span>
                <span className={team2Won ? "font-black text-amber-700 dark:text-amber-300" : ""}>
                  {setEntry.scoreTeam2}
                </span>
              </span>
            );
          })}
        </div>
      ) : null}

      {children}
    </article>
  );
}
