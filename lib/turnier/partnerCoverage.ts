import type { RoundEntry } from "@/components/turnier/types";

export function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

/** Anzahl ungeordneter Spielerpaare (Partner-Kombinationen) für n aktive Spieler. */
export function partnerPairsNeeded(n: number): number {
  if (n < 2) return 0;
  return (n * (n - 1)) / 2;
}

export function countCoveredPartnerPairsFromRounds(
  rounds: RoundEntry[],
  activePlayerIds: Set<string>,
): number {
  const seen = new Set<string>();
  for (const round of rounds) {
    for (const match of round.matches) {
      const team1 = match.players.filter((p) => p.team === 1).map((p) => p.playerId);
      const team2 = match.players.filter((p) => p.team === 2).map((p) => p.playerId);
      for (const team of [team1, team2]) {
        if (team.length !== 2) continue;
        const [x, y] = team;
        if (!activePlayerIds.has(x) || !activePlayerIds.has(y)) continue;
        seen.add(pairKey(x, y));
      }
    }
  }
  return seen.size;
}

export type PartnerCoverageStats = {
  activeCount: number;
  covered: number;
  needed: number;
  complete: boolean;
  /** Informativ: unter idealer Ausnutzung pro Runde (2 Partnerpaare pro Match, floor(n/4) Matches). */
  estimatedRoundsTotal: number;
};

export function getPartnerCoverageStats(
  rounds: RoundEntry[],
  activePlayerIds: string[],
): PartnerCoverageStats {
  const activeSet = new Set(activePlayerIds);
  const n = activeSet.size;
  const needed = partnerPairsNeeded(n);
  const covered = countCoveredPartnerPairsFromRounds(rounds, activeSet);
  const matchesPerRound = Math.floor(n / 4);
  const maxNewPairsPerRound = 2 * matchesPerRound;
  const estimatedRoundsTotal =
    needed === 0 ? 0 : Math.ceil(needed / Math.max(1, maxNewPairsPerRound));

  return {
    activeCount: n,
    covered,
    needed,
    complete: needed > 0 && covered >= needed,
    estimatedRoundsTotal,
  };
}

export function isPartnerCoverageCompleteFromRounds(
  rounds: RoundEntry[],
  activePlayerIds: string[],
): boolean {
  const stats = getPartnerCoverageStats(rounds, activePlayerIds);
  return stats.complete;
}

/** Für Server: minimale Match-Struktur wie aus Prisma-Include. */
type MatchPlayerRow = { playerId: string; team: number };

type MatchRow = { players: MatchPlayerRow[] };

type RoundRow = { matches: MatchRow[] };

export function countCoveredPartnerPairsFromPrismaRounds(
  rounds: RoundRow[],
  activePlayerIds: Set<string>,
): number {
  const seen = new Set<string>();
  for (const round of rounds) {
    for (const match of round.matches) {
      const team1 = match.players.filter((p) => p.team === 1).map((p) => p.playerId);
      const team2 = match.players.filter((p) => p.team === 2).map((p) => p.playerId);
      for (const team of [team1, team2]) {
        if (team.length !== 2) continue;
        const [x, y] = team;
        if (!activePlayerIds.has(x) || !activePlayerIds.has(y)) continue;
        seen.add(pairKey(x, y));
      }
    }
  }
  return seen.size;
}

export function isPartnerCoverageCompletePrisma(
  rounds: RoundRow[],
  activePlayerIds: string[],
): boolean {
  const n = activePlayerIds.length;
  const needed = partnerPairsNeeded(n);
  if (needed === 0) return false;
  const covered = countCoveredPartnerPairsFromPrismaRounds(rounds, new Set(activePlayerIds));
  return covered >= needed;
}
