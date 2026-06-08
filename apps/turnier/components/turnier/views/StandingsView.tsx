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
        <h2 className="truncate text-xl font-black tracking-tight">Tabelle</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#8DC4AA]/50 bg-[#DAF7E9]/80 px-3 py-2 text-xs text-[#1E5E3F] sm:px-4 sm:py-3 sm:text-sm dark:border-[#4C9170]/40 dark:bg-[#06331D]/60 dark:text-[#DAF7E9]">
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
