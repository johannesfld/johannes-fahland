import type { ScoringMode, TournamentConfig, TournamentMode } from "@/components/turnier/types";

export const DEFAULT_SCORING: ScoringMode = "points210";

export const SCORING_ORDER: ScoringMode[] = ["points210", "points310", "winsFirst"];

export const SCORING_LABELS: Record<ScoringMode, string> = {
  points210: "2:1:0",
  points310: "3:1:0",
  winsFirst: "Nach Siegen",
};

export const SCORING_HINTS: Record<ScoringMode, string> = {
  points210: "Sieg 2, Unentschieden 1, Niederlage 0. Rangfolge nach Punkten.",
  points310: "Sieg 3, Unentschieden 1, Niederlage 0. Siege zählen stärker.",
  winsFirst: "Rangfolge nach Siegen, Unentschieden nur als Feinwertung – ohne Punktespalte.",
};

/** Punkte pro Sieg (für Anzeigetexte). */
export const WIN_POINTS: Record<ScoringMode, number> = {
  points210: 2,
  points310: 3,
  winsFirst: 1,
};

export function resolveScoring(config: TournamentConfig | null | undefined): ScoringMode {
  const value = config?.scoring;
  return value && SCORING_ORDER.includes(value) ? value : DEFAULT_SCORING;
}

/**
 * Match-Punkte eines Spielers. Ohne Unentschieden ist `points210` streng
 * monoton zur Siegzahl – die Rangfolge bleibt damit identisch zu früher.
 */
export function matchPoints(scoring: ScoringMode, wins: number, draws: number): number {
  return wins * WIN_POINTS[scoring] + draws;
}

export function usesMatchPoints(scoring: ScoringMode): boolean {
  return scoring !== "winsFirst";
}

/**
 * Unentschieden sind überall möglich, wo niemand weiterkommen muss. K.-o.-Matches
 * brauchen zwingend einen Sieger, sonst bleibt der nächste Bracket-Platz leer –
 * bei Gruppe+K.o. betrifft das genau die Matches ohne Gruppenzuordnung.
 */
export function drawsAllowedForMatch(
  mode: TournamentMode,
  groupLabel: string | null | undefined,
): boolean {
  if (mode === "knockout") return false;
  if (mode === "groups_ko") return Boolean(groupLabel);
  return true;
}
