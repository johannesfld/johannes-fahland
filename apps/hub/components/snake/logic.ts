import type { Dir, GameState, Point } from "./types";
import { GRID } from "./types";

function randomFood(snake: Point[]): Point {
  let food: Point;
  do {
    food = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
  return food;
}

const START_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export function createInitialState(): GameState {
  const snake = START_SNAKE.map((s) => ({ ...s }));
  return {
    snake,
    food: randomFood(snake),
    dir: "right",
    nextDir: "right",
    score: 0,
    status: "idle",
  };
}

/**
 * Deterministischer Zustand für SSR + ersten Client-Render. food-Position fix
 * (kein Math.random → kein Hydration-Mismatch). Die Komponente ersetzt food nach
 * dem Mount durch eine echte Zufallsposition.
 */
export function createSSRState(): GameState {
  return {
    snake: START_SNAKE.map((s) => ({ ...s })),
    food: { x: 14, y: 10 },
    dir: "right",
    nextDir: "right",
    score: 0,
    status: "idle",
  };
}

export function tick(state: GameState): GameState {
  if (state.status !== "running") return state;

  const dir = state.nextDir;
  const head = state.snake[0];

  const delta: Record<Dir, Point> = {
    up:    { x: 0,  y: -1 },
    down:  { x: 0,  y: 1  },
    left:  { x: -1, y: 0  },
    right: { x: 1,  y: 0  },
  };

  const next: Point = {
    x: (head.x + delta[dir].x + GRID) % GRID,
    y: (head.y + delta[dir].y + GRID) % GRID,
  };

  const hitSelf = state.snake.some((s) => s.x === next.x && s.y === next.y);
  if (hitSelf) {
    return { ...state, status: "over" };
  }

  const ate = next.x === state.food.x && next.y === state.food.y;
  const newSnake = [next, ...state.snake];
  if (!ate) newSnake.pop();

  return {
    ...state,
    snake: newSnake,
    food: ate ? randomFood(newSnake) : state.food,
    score: ate ? state.score + 10 : state.score,
    dir,
  };
}

export function applyDir(current: Dir, next: Dir): Dir {
  const opposites: Record<Dir, Dir> = {
    up: "down", down: "up", left: "right", right: "left",
  };
  return opposites[current] === next ? current : next;
}
