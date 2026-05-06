export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getTournamentById } from "@/app/actions/turnier";
import { TurnierApp } from "@/components/turnier/TurnierApp";

type TournamentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  if (!tournament) {
    notFound();
  }
  return <TurnierApp initialTournament={tournament} />;
}
