import { FLEET, GRID_SIZE, type FleetShipId } from "./constants";
import { cellKey, inBounds, type Cell } from "./coords";

export type Shot = "empty" | "hit" | "miss";

export type PlacedShip = {
  id: FleetShipId;
  cells: Cell[];
};

export function emptyShotGrid(): Shot[][] {
  const g: Shot[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: Shot[] = [];
    for (let c = 0; c < GRID_SIZE; c++) row.push("empty");
    g.push(row);
  }
  return g;
}

export function segmentCells(
  anchor: Cell,
  length: number,
  vertical: boolean,
): Cell[] {
  const out: Cell[] = [];
  for (let i = 0; i < length; i++) {
    const r = vertical ? anchor.r + i : anchor.r;
    const c = vertical ? anchor.c : anchor.c + i;
    out.push({ r, c });
  }
  return out;
}

/** Legt ein Schiff so, dass es `through` enthält (linkes/obriges Ende möglichst weit links/oben). */
export function segmentCoveringCell(
  through: Cell,
  length: number,
  vertical: boolean,
): Cell[] | null {
  if (vertical) {
    const low = Math.max(0, through.r - length + 1);
    const high = Math.min(through.r, GRID_SIZE - length);
    if (low > high) return null;
    return segmentCells({ r: low, c: through.c }, length, true);
  }
  const low = Math.max(0, through.c - length + 1);
  const high = Math.min(through.c, GRID_SIZE - length);
  if (low > high) return null;
  return segmentCells({ r: through.r, c: low }, length, false);
}

/**
 * Segment so positioniert, dass die Mitte (längs der Schiffsachse) möglichst nahe an
 * den gebrochenen Rasterkoordinaten liegt (0…GRID_SIZE), z. B. aus Zeigerposition.
 */
export function segmentCenteredOnPoint(
  fracR: number,
  fracC: number,
  length: number,
  vertical: boolean,
): Cell[] | null {
  if (vertical) {
    const col = Math.min(GRID_SIZE - 1, Math.max(0, Math.round(fracC)));
    let startR = Math.round(fracR - (length - 1) / 2);
    startR = Math.min(GRID_SIZE - length, Math.max(0, startR));
    return segmentCells({ r: startR, c: col }, length, true);
  }
  const row = Math.min(GRID_SIZE - 1, Math.max(0, Math.round(fracR)));
  let startC = Math.round(fracC - (length - 1) / 2);
  startC = Math.min(GRID_SIZE - length, Math.max(0, startC));
  return segmentCells({ r: row, c: startC }, length, false);
}

function allInBounds(cells: Cell[]) {
  return cells.every(({ r, c }) => inBounds(r, c));
}

/** Manhattan-Nachbarn (keine Diagonale): Kantenberührung zwischen zwei Feldern */
function orthoNeighbors(r: number, c: number): Cell[] {
  return [
    { r: r - 1, c },
    { r: r + 1, c },
    { r, c: c - 1 },
    { r, c: c + 1 },
  ].filter(({ r: rr, c: cc }) => inBounds(rr, cc));
}

/**
 * Schiffe dürfen sich nicht orthogonal berühren (keine gemeinsame Kante zwischen
 * Zellen verschiedener Schiffe). Ecke an Ecke ist erlaubt.
 */
export function placementValid(ships: PlacedShip[]): boolean {
  if (ships.length === 0) return true;
  const byShip = ships.map((s) => new Set(s.cells.map((x) => cellKey(x.r, x.c))));
  for (let a = 0; a < byShip.length; a++) {
    for (let b = a + 1; b < byShip.length; b++) {
      for (const ka of byShip[a]) {
        const { r, c } = (() => {
          const [rs, cs] = ka.split(",").map(Number);
          return { r: rs, c: cs };
        })();
        for (const nb of orthoNeighbors(r, c)) {
          const kb = cellKey(nb.r, nb.c);
          if (byShip[b].has(kb)) return false;
        }
      }
    }
  }
  return true;
}

export function canAddShip(
  existing: PlacedShip[],
  candidate: PlacedShip,
): boolean {
  if (!allInBounds(candidate.cells)) return false;
  const keys = new Set<string>();
  for (const s of existing) {
    for (const { r, c } of s.cells) {
      keys.add(cellKey(r, c));
    }
  }
  for (const { r, c } of candidate.cells) {
    if (keys.has(cellKey(r, c))) return false;
  }
  return placementValid([...existing, candidate]);
}

export function defenderShipCellSet(ships: PlacedShip[]): Set<string> {
  const s = new Set<string>();
  for (const sh of ships) {
    for (const { r, c } of sh.cells) s.add(cellKey(r, c));
  }
  return s;
}

/** Nach Treffer: Schiffe, bei denen alle Zellen auf dem Schuss-Raster Treffer sind */
export function findNewlySunkShips(
  defenderShips: PlacedShip[],
  outgoingAgainstDefender: Shot[][],
): PlacedShip[] {
  const sunk: PlacedShip[] = [];
  for (const ship of defenderShips) {
    const allHit = ship.cells.every(
      ({ r, c }) => outgoingAgainstDefender[r][c] === "hit",
    );
    if (allHit) sunk.push(ship);
  }
  return sunk;
}

/**
 * Um ein versenktes Schiff: nur die vier Kanten-Nachbarn (oben/unten/links/rechts)
 * auf dem Schuss-Raster als Fehlschuss – keine Diagonalen (Ecken bleiben leer).
 * Felder, die Teil irgendeines gegnerischen Schiffs sind, werden nicht überschrieben.
 */
export function applySunkSurround(
  defenderShips: PlacedShip[],
  sunkShip: PlacedShip,
  outgoing: Shot[][],
): Shot[][] {
  const anyShip = defenderShipCellSet(defenderShips);
  const hull = new Set(sunkShip.cells.map(({ r, c }) => cellKey(r, c)));
  const next = outgoing.map((row) => row.slice());

  for (const { r, c } of sunkShip.cells) {
    for (const nb of orthoNeighbors(r, c)) {
      const k = cellKey(nb.r, nb.c);
      if (hull.has(k)) continue;
      if (anyShip.has(k)) continue;
      if (next[nb.r][nb.c] === "empty") next[nb.r][nb.c] = "miss";
    }
  }
  return next;
}

export function allFleetDestroyed(
  defenderShips: PlacedShip[],
  outgoingAgainstDefender: Shot[][],
): boolean {
  return defenderShips.every((ship) =>
    ship.cells.every(({ r, c }) => outgoingAgainstDefender[r][c] === "hit"),
  );
}

function sortedCells(cells: Cell[]): Cell[] {
  return [...cells].sort((a, b) => a.r - b.r || a.c - b.c);
}

export function isStraightLineShip(cells: Cell[]): boolean {
  if (cells.length === 0) return false;
  const s = sortedCells(cells);
  const vertical = s.every(
    (x, i) => i === 0 || (x.c === s[0].c && x.r === s[i - 1].r + 1),
  );
  const horizontal = s.every(
    (x, i) => i === 0 || (x.r === s[0].r && x.c === s[i - 1].c + 1),
  );
  return vertical || horizontal;
}

export function fleetIsCompleteAndValid(ships: PlacedShip[]): boolean {
  if (ships.length !== FLEET.length) return false;
  const ids = new Set(ships.map((s) => s.id));
  for (const f of FLEET) {
    if (!ids.has(f.id)) return false;
  }
  for (const s of ships) {
    const spec = FLEET.find((f) => f.id === s.id);
    if (!spec || spec.len !== s.cells.length) return false;
    if (!isStraightLineShip(s.cells)) return false;
  }
  return placementValid(ships);
}
