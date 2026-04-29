import { StandingsTable } from "@/components/turnier/components/StandingsTable";
import { turnierCard } from "@/components/turnier/styles";
import type { StandingRow, TournamentDetail } from "@/components/turnier/types";

type StandingsViewProps = {
  rows: StandingRow[];
  tournament: TournamentDetail;
};

export function StandingsView({ rows, tournament }: StandingsViewProps) {
  return (
    <section className={`${turnierCard} flex min-w-0 flex-col gap-4`}>
      <div className="min-w-0">
        <h2 className="truncate text-xl font-black tracking-tight">Tabelle</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Sortierung nach Siegen, danach Satz- und Balldifferenz. Klick auf einen Spieler zeigt seine Spiele.
        </p>
      </div>
      <StandingsTable rows={rows} tournament={tournament} />
    </section>
  );
}
