import type { TournamentConfig, TournamentFormat, TournamentMode } from "@/components/turnier/types";

/** Minimaler Spieler-Input für die Auslosung (aus Prisma TournamentPlayer). */
export type EnginePlayer = {
  id: string;
  roundsPlayed: number;
  roundsSatOut: number;
};

/** Minimale Sicht auf vergangene Runden/Matches (aus Prisma-Include). */
export type EngineMatch = {
  status: "pending" | "playing" | "completed";
  winnerTeam: number | null;
  players: Array<{ playerId: string; team: number }>;
  sets: Array<{ scoreTeam1: number; scoreTeam2: number }>;
  groupLabel?: string | null;
};

export type EngineRound = {
  roundNumber: number;
  status: "drawn" | "playing" | "completed";
  matches: EngineMatch[];
};

export type EngineContext = {
  format: TournamentFormat;
  config: TournamentConfig | null;
  activePlayers: EnginePlayer[];
  /** Alle bisherigen Runden, neueste zuerst ODER egal — Modi sortieren selbst. */
  rounds: EngineRound[];
};

/** Eine geplante Begegnung: Spieler-IDs je Team (1 oder 2 pro Team je nach Format). */
export type PlannedMatch = {
  team1: string[];
  team2: string[];
  groupLabel?: string | null;
  bracketSlot?: number | null;
};

/** Ergebnis einer Auslosung — generisch über alle Modi. */
export type RoundPlan = {
  matches: PlannedMatch[];
  benchedPlayerIds: string[];
  /** Optionales Label für die Runde (z.B. "Halbfinale", "Gruppenphase R2"). */
  stageLabel?: string | null;
};

export type DrawOutcome =
  | { ok: true; plan: RoundPlan }
  | { ok: false; error: string };

export type TournamentModeEngine = {
  id: TournamentMode;
  label: string;
  /** Spielarten, die dieser Modus unterstützt. */
  supportsFormats: TournamentFormat[];
  /** Mindestzahl aktiver Spieler. */
  minPlayers: (ctx: EngineContext) => number;
  /** Plant die nächste Runde. */
  drawNextRound: (ctx: EngineContext) => DrawOutcome;
  /** True, wenn keine weitere Runde mehr ausgelost werden soll. */
  isComplete: (ctx: EngineContext) => boolean;
};
