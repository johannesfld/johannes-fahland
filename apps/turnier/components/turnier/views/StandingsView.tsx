import { StandingsTable } from "@/components/turnier/components/StandingsTable";
import { subtleBtn, turnierCard } from "@/components/turnier/styles";
import type { StandingRow, TournamentDetail } from "@/components/turnier/types";

type StandingsViewProps = {
  rows: StandingRow[];
  tournament: TournamentDetail;
  viewedRoundNumber: number | null;
  latestRoundNumber: number | null;
  isViewingLatestRound: boolean;
  hasRounds: boolean;
  onJumpToLatest: () => void;
};

export function StandingsView({
  rows,
  tournament,
  viewedRoundNumber,
  latestRoundNumber,
  isViewingLatestRound,
  hasRounds,
  onJumpToLatest,
}: StandingsViewProps) {
  const throughRound =
    hasRounds && viewedRoundNumber != null ? viewedRoundNumber : null;
  const showHistoricalBanner = hasRounds && !isViewingLatestRound;

  return (
    <section className={`${turnierCard} flex min-w-0 flex-col gap-4`}>
      <div className="min-w-0 space-y-2">
        <h2 className="truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl">Tabelle</h2>
        <p className="text-sm text-[var(--vibe-fg-muted)]">
          {throughRound != null ? (
            <>
              Stand kumulativ bis einschließlich Runde {throughRound}
              {latestRoundNumber != null && throughRound !== latestRoundNumber
                ? ` (aktuell ausgelost: Runde ${latestRoundNumber})`
                : null}
              . Sortierung nach Siegen, danach Satz- und Balldifferenz. Klick auf einen Spieler zeigt seine
              Spiele in diesem Zeitraum.
            </>
          ) : (
            <>
              Sortierung nach Siegen, danach Satz- und Balldifferenz. Klick auf einen Spieler zeigt seine
              Spiele.
            </>
          )}
        </p>
      </div>

      {showHistoricalBanner ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--vibe-fg-base)] sm:px-4 sm:py-3 sm:text-sm">
          <p className="min-w-0 flex-1 font-semibold">
            <span className="hidden sm:inline">
              Du siehst den Stand einer früheren Runde. Neuere Ergebnisse sind in dieser Ansicht nicht
              enthalten.
            </span>
            <span className="sm:hidden">Frühere Runde – neuere Ergebnisse fehlen hier.</span>
          </p>
          <button type="button" className={subtleBtn} onClick={onJumpToLatest}>
            Zur aktuellen Runde
          </button>
        </div>
      ) : null}

      <StandingsTable rows={rows} tournament={tournament} throughRoundInclusive={throughRound} />
    </section>
  );
}
