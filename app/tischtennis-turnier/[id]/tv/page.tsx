export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getTournamentById } from "@/app/actions/turnier";
import { TVView } from "@/components/turnier/views/TVView";

type TournamentTVPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TournamentTVPage({ params }: TournamentTVPageProps) {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  if (!tournament) {
    notFound();
  }
  return <TVView tournament={tournament} />;
}
