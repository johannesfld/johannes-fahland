import type { FleetShipId } from "@/lib/schiffe/constants";
import type { Cell } from "@/lib/schiffe/coords";
import type { PlacedShip, Shot } from "@/lib/schiffe/rules";

export type GameMode = "single" | "twoPlayerTracker";
export type Phase = "modeSelect" | "place" | "play" | "finished";
export type PlayBoardTab = "fleet" | "target";
export type Turn = "player" | "bot";
export type BotShotResult = "hit" | "miss" | "sunk";

export type BotShotFeedback = {
  cell: Cell;
  result: BotShotResult;
  hitShipId: FleetShipId | null;
};

export type SinglePlayerState = {
  botShips: PlacedShip[];
  playerShots: Shot[][];
  botShots: Shot[][];
  selectedTarget: Cell | null;
  turn: Turn;
  lastBotShot: BotShotFeedback | null;
};

export type GameState = {
  mode: GameMode | null;
  phase: Phase;
  myShips: PlacedShip[];
  trackerShotGrid: Shot[][];
  trackerPending: Cell | null;
  trackerManualMisses: Set<string>;
  single: SinglePlayerState | null;
  winner: Turn | null;
};

export type GameAction =
  | { type: "RESET" }
  | { type: "SET_MODE"; mode: GameMode }
  | { type: "CLEAR_BOT_FEEDBACK" }
  | { type: "PLACE_SHIP"; ship: PlacedShip }
  | { type: "REMOVE_SHIP"; id: FleetShipId }
  | { type: "ADVANCE_PLACEMENT" }
  | { type: "TRACKER_SELECT"; cell: Cell }
  | { type: "TRACKER_CLEAR_SELECT" }
  | { type: "TRACKER_MARK"; mark: "hit" | "miss" }
  | { type: "TRACKER_SUNK" }
  | { type: "TRACKER_UNDO" }
  | { type: "SINGLE_SELECT_TARGET"; cell: Cell }
  | { type: "SINGLE_CLEAR_TARGET" }
  | { type: "SINGLE_FIRE" }
  | { type: "SINGLE_BOT_SHOT"; cell: Cell };
