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
    "border-[var(--vibe-line)] bg-[var(--neutral-soft)] text-[var(--neutral-ink)]",
  playing:
    "border-[var(--warn)]/40 bg-[var(--warn-soft)] text-[var(--warn-ink)]",
  completed:
    "border-[var(--ok)]/40 bg-[var(--ok-soft)] text-[var(--ok-ink)]",
};

export function MatchCard({ match, children }: MatchCardProps) {
  const team1 = match.players.filter((player) => player.team === 1);
  const team2 = match.players.filter((player) => player.team === 2);
  const isCompleted = match.status === "completed";
  const team1Wins = match.winnerTeam === 1;
  const team2Wins = match.winnerTeam === 2;

  const teamBase =
    "min-w-0 break-words rounded-[var(--vibe-r-lg)] p-3 text-sm font-semibold transition-colors duration-200 sm:text-base";
  // Sieger = Akzent-getönt, Verlierer = gedämpft, offen = neutrale Fläche.
  const winnerTone =
    "bg-[var(--accent-soft)] text-[var(--vibe-fg-base)] ring-2 ring-[var(--accent)]/50";
  const loserTone = "bg-[var(--vibe-bg-sunken)] text-[var(--vibe-fg-muted)] opacity-70";
  const openTone = "bg-[var(--vibe-bg-sunken)] text-[var(--vibe-fg-base)]";
  const team1Tone = isCompleted ? (team1Wins ? winnerTone : loserTone) : openTone;
  const team2Tone = isCompleted ? (team2Wins ? winnerTone : loserTone) : openTone;

  return (
    <article className={`${turnierCard} flex min-w-0 flex-col gap-3`}>
      <header className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
          Match {match.matchNumber}
        </p>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_TONE[match.status]}`}
        >
          {STATUS_LABEL[match.status]}
        </span>
      </header>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <div className={`${teamBase} ${team1Tone}`}>
          {team1.map((player) => player.name).join(" / ") || "–"}
        </div>
        <span className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)] sm:text-xs">
          vs
        </span>
        <div className={`${teamBase} ${team2Tone}`}>
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
                className="inline-flex items-center gap-1 rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-2.5 py-1 font-mono text-[11px] text-[var(--vibe-fg-muted)]"
              >
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
                  S{setEntry.setNumber}
                </span>
                <span className={team1Won ? "font-bold text-[var(--accent)]" : ""}>
                  {setEntry.scoreTeam1}
                </span>
                <span className="text-[var(--vibe-fg-faint)]">:</span>
                <span className={team2Won ? "font-bold text-[var(--accent)]" : ""}>
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
