import { FLEET, GRID_SIZE, type FleetShipId } from "@/lib/schiffe/constants";
import type { Cell } from "@/lib/schiffe/coords";
import {
  canAddShip,
  segmentCells,
  type PlacedShip,
  type Shot,
} from "@/lib/schiffe/rules";
import { orthoHitComponent } from "@/lib/schiffe/tracking";

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

export function randomBotFleet(): PlacedShip[] {
  const placed: PlacedShip[] = [];
  const specs = [...FLEET].sort((a, b) => b.len - a.len);

  for (const spec of specs) {
    let added = false;
    for (let i = 0; i < 600 && !added; i++) {
      const vertical = Math.random() < 0.5;
      const maxR = vertical ? GRID_SIZE - spec.len : GRID_SIZE - 1;
      const maxC = vertical ? GRID_SIZE - 1 : GRID_SIZE - spec.len;
      const anchor = { r: randomInt(maxR + 1), c: randomInt(maxC + 1) };
      const cells = segmentCells(anchor, spec.len, vertical);
      const ship: PlacedShip = {
        id: spec.id as FleetShipId,
        cells,
      };
      if (!canAddShip(placed, ship)) continue;
      placed.push(ship);
      added = true;
    }
    if (!added) {
      // fallback with deterministic scan in the unlikely case random retries fail
      for (let r = 0; r < GRID_SIZE && !added; r++) {
        for (let c = 0; c < GRID_SIZE && !added; c++) {
          for (const vertical of [false, true]) {
            const cells = segmentCells({ r, c }, spec.len, vertical);
            if (
              cells.some((x) => x.r >= GRID_SIZE || x.c >= GRID_SIZE || x.r < 0 || x.c < 0)
            ) {
              continue;
            }
            const ship: PlacedShip = { id: spec.id as FleetShipId, cells };
            if (!canAddShip(placed, ship)) continue;
            placed.push(ship);
            added = true;
            break;
          }
        }
      }
    }
  }
  return placed;
}

function neighbors(r: number, c: number): Cell[] {
  return [
    { r: r - 1, c },
    { r: r + 1, c },
    { r, c: c - 1 },
    { r, c: c + 1 },
  ].filter((x) => x.r >= 0 && x.r < GRID_SIZE && x.c >= 0 && x.c < GRID_SIZE);
}

function uniqueCells(cells: Cell[]): Cell[] {
  const seen = new Set<string>();
  const out: Cell[] = [];
  for (const cell of cells) {
    const key = `${cell.r},${cell.c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cell);
  }
  return out;
}

function randomFrom(cells: Cell[]): Cell {
  return cells[randomInt(cells.length)];
}

export function chooseBotShot(botShots: Shot[][]): Cell {
  const components: Cell[][] = [];
  const visited = new Set<string>();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (botShots[r][c] !== "hit") continue;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      const comp = orthoHitComponent(botShots, r, c);
      for (const cell of comp) visited.add(`${cell.r},${cell.c}`);
      components.push(comp);
    }
  }

  const highPriority: Cell[] = [];
  const mediumPriority: Cell[] = [];
  for (const comp of components) {
    if (comp.length > 1) {
      const sameRow = comp.every((x) => x.r === comp[0].r);
      const sameCol = comp.every((x) => x.c === comp[0].c);
      if (sameRow) {
        const row = comp[0].r;
        const minC = Math.min(...comp.map((x) => x.c));
        const maxC = Math.max(...comp.map((x) => x.c));
        const ends = [
          { r: row, c: minC - 1 },
          { r: row, c: maxC + 1 },
        ];
        for (const cell of ends) {
          if (
            cell.r >= 0 &&
            cell.r < GRID_SIZE &&
            cell.c >= 0 &&
            cell.c < GRID_SIZE &&
            botShots[cell.r][cell.c] === "empty"
          ) {
            highPriority.push(cell);
          }
        }
      } else if (sameCol) {
        const col = comp[0].c;
        const minR = Math.min(...comp.map((x) => x.r));
        const maxR = Math.max(...comp.map((x) => x.r));
        const ends = [
          { r: minR - 1, c: col },
          { r: maxR + 1, c: col },
        ];
        for (const cell of ends) {
          if (
            cell.r >= 0 &&
            cell.r < GRID_SIZE &&
            cell.c >= 0 &&
            cell.c < GRID_SIZE &&
            botShots[cell.r][cell.c] === "empty"
          ) {
            highPriority.push(cell);
          }
        }
      }
    }
    for (const hit of comp) {
      for (const nb of neighbors(hit.r, hit.c)) {
        if (botShots[nb.r][nb.c] !== "empty") continue;
        mediumPriority.push(nb);
      }
    }
  }

  const uniqueHigh = uniqueCells(highPriority);
  if (uniqueHigh.length > 0) return randomFrom(uniqueHigh);
  const uniqueMedium = uniqueCells(mediumPriority);
  if (uniqueMedium.length > 0) return randomFrom(uniqueMedium);

  const parityCandidates: Cell[] = [];
  const allCandidates: Cell[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (botShots[r][c] !== "empty") continue;
      const cell = { r, c };
      allCandidates.push(cell);
      if ((r + c) % 2 === 0) parityCandidates.push(cell);
    }
  }
  if (parityCandidates.length > 0) return randomFrom(parityCandidates);
  return randomFrom(allCandidates);
}
