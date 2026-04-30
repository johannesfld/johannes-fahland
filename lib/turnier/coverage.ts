import type { RoundEntry } from "@/components/turnier/types";
import type { TournamentFormat } from "@/components/turnier/types";
import { pairKey, partnerPairsNeeded } from "@/lib/turnier/partnerCoverage";

export type CoverageStats = {
  activeCount: number;
  covered: number;
  needed: number;
  complete: boolean;
  estimatedRoundsTotal: number;
};

function countCoveredFromRoundEntries(
  rounds: RoundEntry[],
  activePlayerIds: Set<string>,
  format: TournamentFormat,
): number {
  const seen = new Set<string>();
  for (const round of rounds) {
    for (const match of round.matches) {
      const team1 = match.players.filter((p) => p.team === 1).map((p) => p.playerId);
      const team2 = match.players.filter((p) => p.team === 2).map((p) => p.playerId);
      if (format === "doubles") {
        for (const team of [team1, team2]) {
          if (team.length !== 2) continue;
          const [x, y] = team;
          if (!activePlayerIds.has(x) || !activePlayerIds.has(y)) continue;
          seen.add(pairKey(x, y));
        }
      } else {
        if (team1.length === 1 && team2.length === 1) {
          const x = team1[0];
          const y = team2[0];
          if (!activePlayerIds.has(x) || !activePlayerIds.has(y)) continue;
          seen.add(pairKey(x, y));
        }
      }
    }
  }
  return seen.size;
}

export function getCoverageStats(
  rounds: RoundEntry[],
  activePlayerIds: string[],
  format: TournamentFormat,
): CoverageStats {
  const activeSet = new Set(activePlayerIds);
  const n = activeSet.size;
  const needed = partnerPairsNeeded(n);
  const covered = countCoveredFromRoundEntries(rounds, activeSet, format);
  const matchesPerRound =
    format === "doubles" ? Math.floor(n / 4) : Math.floor(n / 2);
  const maxNewPairsPerRound =
    format === "doubles" ? 2 * Math.max(1, matchesPerRound) : Math.max(1, matchesPerRound);
  const estimatedRoundsTotal =
    needed === 0 ? 0 : Math.ceil(needed / maxNewPairsPerRound);

  return {
    activeCount: n,
    covered,
    needed,
    complete: needed > 0 && covered >= needed,
    estimatedRoundsTotal,
  };
}

/** Für Server: minimale Match-Struktur wie aus Prisma-Include. */
type MatchPlayerRow = { playerId: string; team: number };
type MatchRow = { players: MatchPlayerRow[] };
type RoundRow = { matches: MatchRow[] };

function countCoveredFromPrismaRounds(
  rounds: RoundRow[],
  activePlayerIds: Set<string>,
  format: TournamentFormat,
): number {
  const seen = new Set<string>();
  for (const round of rounds) {
    for (const match of round.matches) {
      const team1 = match.players.filter((p) => p.team === 1).map((p) => p.playerId);
      const team2 = match.players.filter((p) => p.team === 2).map((p) => p.playerId);
      if (format === "doubles") {
        for (const team of [team1, team2]) {
          if (team.length !== 2) continue;
          const [x, y] = team;
          if (!activePlayerIds.has(x) || !activePlayerIds.has(y)) continue;
          seen.add(pairKey(x, y));
        }
      } else {
        if (team1.length === 1 && team2.length === 1) {
          const x = team1[0];
          const y = team2[0];
          if (!activePlayerIds.has(x) || !activePlayerIds.has(y)) continue;
          seen.add(pairKey(x, y));
        }
      }
    }
  }
  return seen.size;
}

export function isCoverageCompletePrisma(
  rounds: RoundRow[],
  activePlayerIds: string[],
  format: TournamentFormat,
): boolean {
  const n = activePlayerIds.length;
  const needed = partnerPairsNeeded(n);
  if (needed === 0) return false;
  const covered = countCoveredFromPrismaRounds(rounds, new Set(activePlayerIds), format);
  return covered >= needed;
}
