export const dynamic = 'force-dynamic';

import { getTournamentList } from "@/app/actions/turnier";
import { TurnierList } from "@/components/turnier/TurnierList";

export default async function TischtennisTurnierPage() {
  const tournaments = await getTournamentList();
  return <TurnierList initialItems={tournaments} />;
}
