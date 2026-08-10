import { buildStandings } from "@/lib/turnier/standings";
import type { StandingRow, TournamentDetail } from "@/components/turnier/types";

// Match-Auswertung liegt in lib/, damit Server-Actions und Client dieselbe
// Regel verwenden – hier nur durchgereicht.
export {
  computeMatchResult,
  getRequiredSetSlots,
  getWinsPerTeam,
} from "@/lib/turnier/matchResult";
export type { MatchResult } from "@/lib/turnier/matchResult";

export function getCurrentRound(tournament: TournamentDetail | null) {
  if (!tournament) return null;
  const open = tournament.rounds.find((round) => round.status !== "completed");
  return open ?? tournament.rounds[tournament.rounds.length - 1] ?? null;
}

export function standingsForTournament(
  tournament: TournamentDetail | null,
  throughRoundInclusive?: number | null,
): StandingRow[] {
  if (!tournament) return [];
  return buildStandings(tournament, { throughRoundInclusive });
}
