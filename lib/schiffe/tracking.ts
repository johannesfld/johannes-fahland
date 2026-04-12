import { GRID_SIZE } from "./constants";
import { cellKey, type Cell } from "./coords";
import { applySunkSurround, type PlacedShip, type Shot } from "./rules";

const ORTHO: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/** Orthogonaler Nachbar mit Treffer? (für manuellen „Versenkt“-Button). */
export function hasOrthoHitNeighbor(grid: Shot[][], r: number, c: number): boolean {
  if (grid[r][c] !== "hit") return false;
  for (const [dr, dc] of ORTHO) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr < 0 || rr >= GRID_SIZE || cc < 0 || cc >= GRID_SIZE) continue;
    if (grid[rr][cc] === "hit") return true;
  }
  return false;
}

/** Alle orthogonal zusammenhängenden Treffer-Felder ab (r,c). */
export function orthoHitComponent(grid: Shot[][], r: number, c: number): Cell[] {
  if (grid[r][c] !== "hit") return [];
  const out: Cell[] = [];
  const seen = new Set<string>();
  const stack: Cell[] = [{ r, c }];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    const k = cellKey(cur.r, cur.c);
    if (seen.has(k)) continue;
    if (grid[cur.r][cur.c] !== "hit") continue;
    seen.add(k);
    out.push(cur);
    for (const [dr, dc] of ORTHO) {
      const rr = cur.r + dr;
      const cc = cur.c + dc;
      if (rr < 0 || rr >= GRID_SIZE || cc < 0 || cc >= GRID_SIZE) continue;
      const nk = cellKey(rr, cc);
      if (!seen.has(nk) && grid[rr][cc] === "hit") stack.push({ r: rr, c: cc });
    }
  }
  return out;
}

/**
 * Wenn es eine durchgehende horizontale oder vertikale Linie von ≥5 Treffern gibt,
 * die (r,c) enthält: genau 5 Zellen dieser Linie (Fenster), das (r,c) enthält.
 * Mehrere gültige Fenster (z. B. 6 Treffer in einer Reihe): Fenster, dessen Mittelpunkt
 * am nächsten an c bzw. r liegt.
 */
export function fiveHitSegmentContaining(
  grid: Shot[][],
  r: number,
  c: number,
): Cell[] | null {
  if (grid[r][c] !== "hit") return null;

  const pickWindow = (min: number, max: number, coord: number): [number, number] | null => {
    const len = max - min + 1;
    if (len < 5) return null;
    const lowStart = Math.max(min, coord - 4);
    const highStart = Math.min(max - 4, coord);
    if (lowStart > highStart) return null;
    let bestStart = lowStart;
    let bestDist = Infinity;
    for (let s = lowStart; s <= highStart; s++) {
      const mid = s + 2;
      const d = Math.abs(mid - coord);
      if (d < bestDist) {
        bestDist = d;
        bestStart = s;
      }
    }
    return [bestStart, bestStart + 4];
  };

  let minC = c;
  let maxC = c;
  while (minC - 1 >= 0 && grid[r][minC - 1] === "hit") minC--;
  while (maxC + 1 < GRID_SIZE && grid[r][maxC + 1] === "hit") maxC++;
  const hWin = pickWindow(minC, maxC, c);

  let minR = r;
  let maxR = r;
  while (minR - 1 >= 0 && grid[minR - 1][c] === "hit") minR--;
  while (maxR + 1 < GRID_SIZE && grid[maxR + 1][c] === "hit") maxR++;
  const vWin = pickWindow(minR, maxR, r);

  if (hWin && vWin) {
    return Array.from({ length: 5 }, (_, i) => ({ r, c: hWin[0] + i }));
  }
  if (hWin) {
    return Array.from({ length: 5 }, (_, i) => ({ r, c: hWin[0] + i }));
  }
  if (vWin) {
    return Array.from({ length: 5 }, (_, i) => ({ r: vWin[0] + i, c }));
  }
  return null;
}

/** Wasser orthogonal um die Rumpf-Zellen (ohne Gegner-Schiffe im State). */
export function applyVersenktHull(grid: Shot[][], hullCells: Cell[]): Shot[][] {
  const synthetic: PlacedShip = { id: "s5", cells: hullCells };
  return applySunkSurround([], synthetic, grid);
}
