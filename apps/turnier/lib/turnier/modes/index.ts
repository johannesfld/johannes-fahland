import type { TournamentMode } from "@/components/turnier/types";
import type { TournamentModeEngine } from "@/lib/turnier/modes/types";
import { roundRobinEngine } from "@/lib/turnier/modes/roundRobin";
import { knockoutEngine } from "@/lib/turnier/modes/knockout";
import { swissEngine } from "@/lib/turnier/modes/swiss";
import { groupsKoEngine } from "@/lib/turnier/modes/groupsKo";

export const ENGINES: Record<TournamentMode, TournamentModeEngine> = {
  round_robin: roundRobinEngine,
  knockout: knockoutEngine,
  swiss: swissEngine,
  groups_ko: groupsKoEngine,
};

export function getEngine(mode: TournamentMode): TournamentModeEngine {
  return ENGINES[mode] ?? roundRobinEngine;
}

export type { TournamentModeEngine } from "@/lib/turnier/modes/types";
export type {
  EngineContext,
  EnginePlayer,
  EngineRound,
  PlannedMatch,
  RoundPlan,
} from "@/lib/turnier/modes/types";
