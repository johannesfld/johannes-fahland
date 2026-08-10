import { bestOfToWinsNeeded } from "@/lib/turnier/validation";
import type { BestOf, MatchSet } from "@/components/turnier/types";

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

export type MatchResult = {
  /** Das Match ist abschließbar. */
  decided: boolean;
  /** `null` bei Unentschieden – nur zusammen mit `decided: true` aussagekräftig. */
  winnerTeam: 1 | 2 | null;
};

/**
 * Ergebnis eines Matches aus seinen Sätzen.
 *
 * Ohne Unentschieden gilt die alte Regel: entschieden ist erst, wer die nötige
 * Satzzahl erreicht – ein Satz mit Gleichstand zählt für niemanden und wird
 * nachgespielt. Sind Unentschieden erlaubt, endet das Match spätestens nach dem
 * letzten Satz: Es gewinnt, wer mehr Sätze geholt hat, bei Gleichstand steht es
 * unentschieden. Der Punktestand selbst ist dabei nie eingeschränkt – 11:11,
 * 12:12 und 15:17 sind gleichermaßen eintragbar.
 */
export function computeMatchResult(
  sets: MatchSet[],
  bestOf: BestOf,
  drawsAllowed: boolean,
): MatchResult {
  const winsNeeded = bestOfToWinsNeeded(bestOf);
  const wins = getWinsPerTeam(sets);
  if (wins.team1 >= winsNeeded) return { decided: true, winnerTeam: 1 };
  if (wins.team2 >= winsNeeded) return { decided: true, winnerTeam: 2 };
  if (drawsAllowed && sets.length >= bestOf) {
    if (wins.team1 > wins.team2) return { decided: true, winnerTeam: 1 };
    if (wins.team2 > wins.team1) return { decided: true, winnerTeam: 2 };
    return { decided: true, winnerTeam: null };
  }
  return { decided: false, winnerTeam: null };
}

/**
 * Wie viele Satz-Eingabefelder angezeigt werden. Mit Unentschieden ist bei
 * `bestOf` Schluss – sonst würde nach einem Gleichstandssatz endlos ein
 * weiteres Feld nachrücken, obwohl das Match bereits unentschieden endet.
 */
export function getRequiredSetSlots(bestOf: BestOf, sets: MatchSet[], drawsAllowed: boolean) {
  const winsNeeded = bestOfToWinsNeeded(bestOf);
  const wins = getWinsPerTeam(sets);
  if (wins.team1 >= winsNeeded || wins.team2 >= winsNeeded) return sets.length;
  const next = Math.max(sets.length + 1, winsNeeded);
  return drawsAllowed ? Math.min(next, bestOf) : next;
}
