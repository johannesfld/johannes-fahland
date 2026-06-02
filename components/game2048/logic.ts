import { BOARD_SIZE, type Direction, type GameState, type Tile } from "./types";

function emptyCells(tiles: Tile[]): Array<{ row: number; col: number }> {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const cells: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function spawnTile(
  tiles: Tile[],
  nextId: number,
): { tiles: Tile[]; nextId: number } {
  const empties = emptyCells(tiles);
  if (empties.length === 0) return { tiles, nextId };
  const cell = empties[Math.floor(Math.random() * empties.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newTile: Tile = {
    id: nextId,
    value,
    row: cell.row,
    col: cell.col,
    isNew: true,
  };
  return { tiles: [...tiles, newTile], nextId: nextId + 1 };
}

export function createInitialState(best: number): GameState {
  let tiles: Tile[] = [];
  let nextId = 1;
  ({ tiles, nextId } = spawnTile(tiles, nextId));
  ({ tiles, nextId } = spawnTile(tiles, nextId));
  return {
    tiles,
    score: 0,
    best,
    nextId,
    status: "playing",
    keepPlaying: false,
  };
}

type Vector = { row: number; col: number };

function vectorFor(dir: Direction): Vector {
  switch (dir) {
    case "up": return { row: -1, col: 0 };
    case "down": return { row: 1, col: 0 };
    case "left": return { row: 0, col: -1 };
    case "right": return { row: 0, col: 1 };
  }
}

/** Traversal order so that tiles farthest from the destination move first. */
function traversals(dir: Direction): { rows: number[]; cols: number[] } {
  const rows = Array.from({ length: BOARD_SIZE }, (_, i) => i);
  const cols = Array.from({ length: BOARD_SIZE }, (_, i) => i);
  if (dir === "down") rows.reverse();
  if (dir === "right") cols.reverse();
  return { rows, cols };
}

function withinBounds(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function tileAt(grid: (Tile | null)[][], r: number, c: number): Tile | null {
  return withinBounds(r, c) ? grid[r][c] : null;
}

function buildGrid(tiles: Tile[]): (Tile | null)[][] {
  const grid: (Tile | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );
  for (const t of tiles) grid[t.row][t.col] = t;
  return grid;
}

function findFarthestPosition(
  grid: (Tile | null)[][],
  start: { row: number; col: number },
  vec: Vector,
): { farthest: { row: number; col: number }; next: { row: number; col: number } } {
  let prev = start;
  let cur = { row: start.row + vec.row, col: start.col + vec.col };
  while (withinBounds(cur.row, cur.col) && grid[cur.row][cur.col] === null) {
    prev = cur;
    cur = { row: cur.row + vec.row, col: cur.col + vec.col };
  }
  return { farthest: prev, next: cur };
}

export type MoveResult = {
  state: GameState;
  moved: boolean;
};

export function move(state: GameState, dir: Direction): MoveResult {
  if (state.status === "over") return { state, moved: false };
  if (state.status === "won" && !state.keepPlaying) return { state, moved: false };

  // Clone tiles, strip per-frame flags
  const tiles: Tile[] = state.tiles.map((t) => ({
    id: t.id,
    value: t.value,
    row: t.row,
    col: t.col,
  }));

  const grid = buildGrid(tiles);
  const vec = vectorFor(dir);
  const { rows, cols } = traversals(dir);
  const mergedTileIds = new Set<number>(); // tiles that already merged this turn
  let moved = false;
  let scoreGained = 0;
  const removedIds = new Set<number>();
  const mergedTargets = new Set<number>();
  let reachedWin = false;

  for (const r of rows) {
    for (const c of cols) {
      const tile = grid[r][c];
      if (!tile) continue;
      const { farthest, next } = findFarthestPosition(grid, { row: r, col: c }, vec);
      const target = tileAt(grid, next.row, next.col);
      if (target && target.value === tile.value && !mergedTileIds.has(target.id)) {
        // Merge tile into target
        const newValue = tile.value * 2;
        target.value = newValue;
        mergedTileIds.add(target.id);
        mergedTargets.add(target.id);
        scoreGained += newValue;
        if (newValue === 2048) reachedWin = true;
        // remove moving tile
        grid[r][c] = null;
        removedIds.add(tile.id);
        moved = true;
      } else if (farthest.row !== r || farthest.col !== c) {
        grid[r][c] = null;
        tile.row = farthest.row;
        tile.col = farthest.col;
        grid[farthest.row][farthest.col] = tile;
        moved = true;
      }
    }
  }

  if (!moved) {
    return { state: { ...state, tiles: state.tiles.map((t) => ({ ...t, isNew: false, mergedFrom: false })) }, moved: false };
  }

  // Rebuild tile list from grid + add isNew/mergedFrom flags
  const newTiles: Tile[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const t = grid[r][c];
      if (t) {
        newTiles.push({
          ...t,
          mergedFrom: mergedTargets.has(t.id),
          isNew: false,
        });
      }
    }
  }

  // Spawn new tile
  let workingTiles = newTiles;
  let nextId = state.nextId;
  ({ tiles: workingTiles, nextId } = spawnTile(workingTiles, nextId));

  const newScore = state.score + scoreGained;
  const newBest = Math.max(state.best, newScore);

  let status: GameState["status"] = state.status;
  if (state.status === "playing" && reachedWin) status = "won";
  if (!hasMoves(workingTiles)) status = "over";

  return {
    state: {
      tiles: workingTiles,
      score: newScore,
      best: newBest,
      nextId,
      status,
      keepPlaying: state.keepPlaying,
    },
    moved: true,
  };
}

function hasMoves(tiles: Tile[]): boolean {
  if (tiles.length < BOARD_SIZE * BOARD_SIZE) return true;
  const grid = buildGrid(tiles);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const t = grid[r][c];
      if (!t) return true;
      const right = tileAt(grid, r, c + 1);
      const down = tileAt(grid, r + 1, c);
      if (right && right.value === t.value) return true;
      if (down && down.value === t.value) return true;
    }
  }
  return false;
}

export function continueAfterWin(state: GameState): GameState {
  return { ...state, keepPlaying: true, status: "playing" };
}
