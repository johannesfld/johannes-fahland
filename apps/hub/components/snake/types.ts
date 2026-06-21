export type Dir = "up" | "down" | "left" | "right";

export type Point = { x: number; y: number };

export type GameStatus = "idle" | "running" | "paused" | "over";

export type GameState = {
  snake: Point[];
  food: Point;
  dir: Dir;
  nextDir: Dir;
  score: number;
  status: GameStatus;
};

export const GRID = 20;
export const TICK_MS = 175;
