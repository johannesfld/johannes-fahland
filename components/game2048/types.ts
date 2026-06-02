export type Direction = "up" | "down" | "left" | "right";

export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  /** Set to true on the frame a tile is merged-into (target). Used for pop animation. */
  mergedFrom?: boolean;
  /** Set to true on the frame a tile is newly spawned. Used for spawn animation. */
  isNew?: boolean;
};

export type GameState = {
  tiles: Tile[];
  score: number;
  best: number;
  /** Monotonically increasing for tile IDs. */
  nextId: number;
  status: "playing" | "won" | "over";
  /** Did the user choose to continue after reaching 2048? */
  keepPlaying: boolean;
};

export const BOARD_SIZE = 4;
