import type { GameState } from "@/components/wizard/types";

export const INITIAL_STATE: GameState = {
  mainStage: "setup",
  gamePhase: "mixer-announcement",
  players: [],
  totalRounds: 0,
  roundNumber: 1,
  mixerIndex: 0,
  currentBidderIndex: 0,
  currentActualIndex: 0,
  pendingBids: [],
  pendingActuals: [],
};
