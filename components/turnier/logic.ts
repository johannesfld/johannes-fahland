import { buildStandings } from "@/lib/turnier/standings";
import { bestOfToWinsNeeded } from "@/lib/turnier/validation";
import type { BestOf, MatchEntry, MatchSet, StandingRow, TournamentDetail } from "@/components/turnier/types";

export function getWinsPerTeam(sets: MatchSet[]) {
  return sets.reduce(
    (acc, setEntry) => {
      if (setEntry.scoreTeam1 > setEntry.scoreTeam2) acc.team1 += 1;
      if (setEntry.scoreTeam2 > setEntry.scoreTeam1) acc.team2 += 1;
      return acc;
    },
    { team1: 0, team2: 0 },
  );
}

export function getRequiredSetSlots(bestOf: BestOf, sets: MatchSet[]) {
  const winsNeeded = bestOfToWinsNeeded(bestOf);
  const wins = getWinsPerTeam(sets);
  if (wins.team1 >= winsNeeded || wins.team2 >= winsNeeded) return sets.length;
  return Math.max(sets.length + 1, winsNeeded);
}

export function canCompleteMatch(bestOf: BestOf, match: MatchEntry) {
  const winsNeeded = bestOfToWinsNeeded(bestOf);
  const wins = getWinsPerTeam(match.sets);
  return wins.team1 >= winsNeeded || wins.team2 >= winsNeeded;
}

export function getCurrentRound(tournament: TournamentDetail | null) {
  if (!tournament) return null;
  const open = tournament.rounds.find((round) => round.status !== "completed");
  return open ?? tournament.rounds[tournament.rounds.length - 1] ?? null;
}

export function standingsForTournament(tournament: TournamentDetail | null): StandingRow[] {
  if (!tournament) return [];
  return buildStandings(tournament);
}
