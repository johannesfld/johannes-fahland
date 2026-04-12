import { GRID_SIZE } from "./constants";

export type Cell = { r: number; c: number };

export function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

export function parseKey(k: string): Cell {
  const [r, c] = k.split(",").map(Number);
  return { r, c };
}

export function inBounds(r: number, c: number) {
  return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
}

/** Spalte 1–10 */
export function colLabel(c: number) {
  return String(c + 1);
}

/** Zeile A–J */
export function rowLabel(r: number) {
  return String.fromCodePoint("A".codePointAt(0)! + r);
}

export function formatCell(rc: Cell) {
  return `${colLabel(rc.c)}${rowLabel(rc.r)}`;
}
