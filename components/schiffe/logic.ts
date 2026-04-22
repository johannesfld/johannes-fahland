import { FLEET, GRID_SIZE } from "@/lib/schiffe/constants";
import type { Cell } from "@/lib/schiffe/coords";
import {
  canAddShip,
  segmentCells,
  segmentCenteredOnPoint,
  segmentCoveringCell,
  type PlacedShip,
} from "@/lib/schiffe/rules";

export function shipAt(
  ships: PlacedShip[],
  r: number,
  c: number,
): PlacedShip | null {
  for (const s of ships) {
    if (s.cells.some((x) => x.r === r && x.c === c)) return s;
  }
  return null;
}

export function placedShipIsVertical(s: PlacedShip): boolean {
  if (s.cells.length < 2) return false;
  const c0 = s.cells[0].c;
  return s.cells.every((x) => x.c === c0);
}

/**
 * Rotations-Kandidat, der den geometrischen Mittelpunkt des Schiffs moeglichst
 * stabil haelt (deutlich weniger "Springen" beim Drehen).
 */
function segmentAroundShipCenter(
  fracR: number,
  fracC: number,
  length: number,
  vertical: boolean,
): Cell[] {
  if (vertical) {
    const col = Math.min(
      GRID_SIZE - 1,
      Math.max(0, Math.round(fracC - 0.5)),
    );
    let startR = Math.round(fracR - length / 2);
    startR = Math.min(GRID_SIZE - length, Math.max(0, startR));
    return segmentCells({ r: startR, c: col }, length, true);
  }
  const row = Math.min(GRID_SIZE - 1, Math.max(0, Math.round(fracR - 0.5)));
  let startC = Math.round(fracC - length / 2);
  startC = Math.min(GRID_SIZE - length, Math.max(0, startC));
  return segmentCells({ r: row, c: startC }, length, false);
}

/** Neues Segment nach Orientierungswechsel; Reihenfolge: Mitte beibehalten, dann über alte Zellen legen, dann leicht verschieben. */
export function cellsAfterRotateShip(
  ship: PlacedShip,
  newVertical: boolean,
  otherShips: PlacedShip[],
): Cell[] | null {
  const spec = FLEET.find((f) => f.id === ship.id);
  if (!spec) return null;
  if (spec.len < 2) return ship.cells;
  const rest = otherShips.filter((s) => s.id !== ship.id);
  const ok = (cells: Cell[] | null): cells is Cell[] => {
    if (!cells) return false;
    return canAddShip(rest, { id: ship.id, cells });
  };

  let sumR = 0;
  let sumC = 0;
  for (const { r, c } of ship.cells) {
    sumR += r + 0.5;
    sumC += c + 0.5;
  }
  const n = ship.cells.length;
  const fracR = sumR / n;
  const fracC = sumC / n;

  const centered = segmentAroundShipCenter(fracR, fracC, spec.len, newVertical);
  if (ok(centered)) return centered;

  for (const through of ship.cells) {
    const seg = segmentCoveringCell(through, spec.len, newVertical);
    if (ok(seg)) return seg;
  }

  for (const dr of [-0.5, 0.5, -1, 1, -1.5, 1.5, -2, 2]) {
    for (const dc of [-0.5, 0.5, -1, 1]) {
      const seg = segmentCenteredOnPoint(
        fracR + dr,
        fracC + dc,
        spec.len,
        newVertical,
      );
      if (ok(seg)) return seg;
    }
  }

  return null;
}

export function emptyPlacementCellRefGrid(): (HTMLButtonElement | null)[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null as HTMLButtonElement | null),
  );
}
