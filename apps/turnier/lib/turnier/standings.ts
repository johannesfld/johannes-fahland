import { matchPoints, resolveScoring, usesMatchPoints } from "@/lib/turnier/scoring";
import type { StandingRow, TournamentDetail } from "@/components/turnier/types";

export type BuildStandingsOptions = {
  /** Nur Matches aus Runden mit `roundNumber <=` diesem Wert zählen. Ohne Option oder `null`: alle Runden. */
  throughRoundInclusive?: number | null;
};

/** Unentschieden zählt wie ein halber Sieg. */
function rateOf(row: { wins: number; draws: number; played: number }) {
  return row.played > 0 ? (row.wins + row.draws / 2) / row.played : 0;
}

export function buildStandings(
  tournament: TournamentDetail,
  options?: BuildStandingsOptions,
): StandingRow[] {
  const maxRound = options?.throughRoundInclusive;
  const scoring = resolveScoring(tournament.config);
  const byPoints = usesMatchPoints(scoring);
  const rows = new Map<string, StandingRow>();

  for (const player of tournament.players) {
    rows.set(player.id, {
      playerId: player.id,
      name: player.name,
      active: player.active,
      rank: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      winRate: 0,
      setsWon: 0,
      setsLost: 0,
      setDiff: 0,
      pointsWon: 0,
      pointsLost: 0,
      pointDiff: 0,
    });
  }

  for (const round of tournament.rounds) {
    if (maxRound != null && round.roundNumber > maxRound) continue;
    for (const match of round.matches) {
      // Abgeschlossen ohne Sieger = Unentschieden; offene Matches zählen nicht.
      if (match.status !== "completed" || match.sets.length === 0) continue;

      const team1 = match.players.filter((p) => p.team === 1);
      const team2 = match.players.filter((p) => p.team === 2);
      const isDraw = match.winnerTeam == null;
      const team1WinsMatch = match.winnerTeam === 1;

      let team1Sets = 0;
      let team2Sets = 0;
      let team1Points = 0;
      let team2Points = 0;

      for (const setEntry of match.sets) {
        team1Points += setEntry.scoreTeam1;
        team2Points += setEntry.scoreTeam2;
        if (setEntry.scoreTeam1 > setEntry.scoreTeam2) {
          team1Sets += 1;
        } else if (setEntry.scoreTeam2 > setEntry.scoreTeam1) {
          team2Sets += 1;
        }
      }

      for (const player of team1) {
        const row = rows.get(player.playerId);
        if (!row) continue;
        row.played += 1;
        row.draws += isDraw ? 1 : 0;
        row.wins += !isDraw && team1WinsMatch ? 1 : 0;
        row.losses += !isDraw && !team1WinsMatch ? 1 : 0;
        row.setsWon += team1Sets;
        row.setsLost += team2Sets;
        row.pointsWon += team1Points;
        row.pointsLost += team2Points;
      }

      for (const player of team2) {
        const row = rows.get(player.playerId);
        if (!row) continue;
        row.played += 1;
        row.draws += isDraw ? 1 : 0;
        row.wins += !isDraw && !team1WinsMatch ? 1 : 0;
        row.losses += !isDraw && team1WinsMatch ? 1 : 0;
        row.setsWon += team2Sets;
        row.setsLost += team1Sets;
        row.pointsWon += team2Points;
        row.pointsLost += team1Points;
      }
    }
  }

  const sorted = [...rows.values()].sort((a, b) => {
    if (byPoints) {
      const aPoints = matchPoints(scoring, a.wins, a.draws);
      const bPoints = matchPoints(scoring, b.wins, b.draws);
      if (bPoints !== aPoints) return bPoints - aPoints;
    } else {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.draws !== a.draws) return b.draws - a.draws;
    }
    const aRate = rateOf(a);
    const bRate = rateOf(b);
    if (bRate !== aRate) return bRate - aRate;
    const aSetDiff = a.setsWon - a.setsLost;
    const bSetDiff = b.setsWon - b.setsLost;
    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
    const aPointDiff = a.pointsWon - a.pointsLost;
    const bPointDiff = b.pointsWon - b.pointsLost;
    if (bPointDiff !== aPointDiff) return bPointDiff - aPointDiff;
    return a.name.localeCompare(b.name, "de");
  });

  let previousSignature = "";
  let previousRank = 0;

  return sorted.map((row, index) => {
    const winRate = rateOf(row);
    const points = matchPoints(scoring, row.wins, row.draws);
    const setDiff = row.setsWon - row.setsLost;
    const pointDiff = row.pointsWon - row.pointsLost;
    const signature = [
      byPoints ? points : `${row.wins}/${row.draws}`,
      winRate.toFixed(6),
      setDiff,
      pointDiff,
    ].join("|");
    const rank = signature === previousSignature ? previousRank : index + 1;
    previousSignature = signature;
    previousRank = rank;

    return {
      ...row,
      rank,
      points,
      setDiff,
      pointDiff,
      winRate,
    };
  });
}
