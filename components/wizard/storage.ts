import { INITIAL_STATE } from "@/components/wizard/state";
import type { GameState } from "@/components/wizard/types";

export const STORAGE_KEY = "wizard-pro-score-v3";

export function loadWizardState(): GameState | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  const parsed: unknown = JSON.parse(saved);
  const ok =
    parsed &&
    typeof parsed === "object" &&
    "mainStage" in parsed &&
    "players" in parsed &&
    Array.isArray((parsed as GameState).players) &&
    Array.isArray((parsed as GameState).pendingBids) &&
    Array.isArray((parsed as GameState).pendingActuals);

  const gs = ok ? (parsed as GameState) : null;
  const n = gs?.players.length ?? 0;
  const inProgress = gs?.mainStage === "game" || gs?.mainStage === "finished";
  const lengthsMatch =
    gs && gs.pendingBids.length === n && gs.pendingActuals.length === n;
  const playerCountOk = !inProgress || (n >= 3 && n <= 6);
  const valid =
    gs &&
    lengthsMatch &&
    playerCountOk &&
    (!inProgress ||
      (Number.isFinite(gs.roundNumber) &&
        Number.isFinite(gs.totalRounds) &&
        gs.mixerIndex >= 0 &&
        gs.mixerIndex < n &&
        gs.currentBidderIndex >= 0 &&
        gs.currentBidderIndex < n &&
        gs.currentActualIndex >= 0 &&
        gs.currentActualIndex < n));

  if (!valid) {
    localStorage.removeItem(STORAGE_KEY);
    return INITIAL_STATE;
  }

  return gs;
}

export function saveWizardState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearWizardState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
