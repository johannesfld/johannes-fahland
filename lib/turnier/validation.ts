export function clampToNonNegativeInt(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (!Number.isInteger(numeric)) return null;
  if (numeric < 0) return null;
  return numeric;
}

export function validateSetScore(scoreA: unknown, scoreB: unknown) {
  const team1 = clampToNonNegativeInt(scoreA);
  const team2 = clampToNonNegativeInt(scoreB);
  if (team1 === null || team2 === null) {
    return { ok: false as const, error: "Bitte gueltige Zahlen >= 0 eintragen." };
  }
  return { ok: true as const, scoreTeam1: team1, scoreTeam2: team2 };
}

export function bestOfToWinsNeeded(bestOf: 1 | 3 | 5) {
  return Math.floor(bestOf / 2) + 1;
}
