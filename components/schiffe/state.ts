import {
  allFleetDestroyed,
  applySunkSurround,
  canAddShip,
  emptyShotGrid,
  fleetIsCompleteAndValid,
  findNewlySunkShips,
  type Shot,
} from "@/lib/schiffe/rules";
import {
  applyVersenktHull,
  fiveHitSegmentContaining,
  hasOrthoHitNeighbor,
  orthoHitComponent,
} from "@/lib/schiffe/tracking";
import { GRID_SIZE } from "@/lib/schiffe/constants";
import { randomBotFleet } from "@/components/schiffe/bot";
import type { GameAction, GameState } from "@/components/schiffe/types";

export const initialGame = (): GameState => ({
  mode: null,
  phase: "modeSelect",
  myShips: [],
  trackerShotGrid: emptyShotGrid(),
  trackerPending: null,
  trackerManualMisses: new Set(),
  single: null,
  winner: null,
});

function cloneShotGrid(grid: Shot[][]): Shot[][] {
  return grid.map((row) => row.slice());
}

/** Nach manuellem Treffer: bei 5 Treffern in einer Zeile/Spalte automatisch Umriss. */
function shotGridAfterHit(grid: Shot[][], r: number, c: number): Shot[][] {
  let next = cloneShotGrid(grid);
  next[r][c] = "hit";
  const seg = fiveHitSegmentContaining(next, r, c);
  if (seg && seg.length === 5) {
    next = applyVersenktHull(next, seg);
  }
  return next;
}

const ORTHO: readonly [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/**
 * Remove a hit or miss from the tracker grid. When removing a hit, also remove
 * any auto-generated surrounding misses (those NOT in trackerManualMisses).
 */
function undoTrackerCell(
  grid: Shot[][],
  r: number,
  c: number,
  manualMisses: Set<string>,
): { nextGrid: Shot[][]; nextManual: Set<string> } {
  const next = cloneShotGrid(grid);
  const cellShot = next[r][c];
  const nextManual = new Set(manualMisses);
  const key = `${r},${c}`;

  if (cellShot === "miss") {
    next[r][c] = "empty";
    nextManual.delete(key);
    return { nextGrid: next, nextManual };
  }

  if (cellShot === "hit") {
    const hull = orthoHitComponent(grid, r, c);
    next[r][c] = "empty";

    for (const hc of hull) {
      for (const [dr, dc] of ORTHO) {
        const nr = hc.r + dr;
        const nc = hc.c + dc;
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
        const nk = `${nr},${nc}`;
        if (next[nr][nc] === "miss" && !nextManual.has(nk)) {
          const isAdjacentToOtherHit = ORTHO.some(([dr2, dc2]) => {
            const hr = nr + dr2;
            const hc2 = nc + dc2;
            if (hr < 0 || hr >= GRID_SIZE || hc2 < 0 || hc2 >= GRID_SIZE) return false;
            if (hr === r && hc2 === c) return false;
            return next[hr][hc2] === "hit";
          });
          if (!isAdjacentToOtherHit) {
            next[nr][nc] = "empty";
          }
        }
      }
    }
    return { nextGrid: next, nextManual };
  }

  return { nextGrid: next, nextManual };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "RESET":
      return initialGame();
    case "SET_MODE":
      return {
        ...initialGame(),
        mode: action.mode,
        phase: "place",
      };
    case "CLEAR_BOT_FEEDBACK": {
      if (!state.single) return state;
      return {
        ...state,
        single: {
          ...state.single,
          lastBotShot: null,
        },
      };
    }
    case "PLACE_SHIP": {
      if (state.phase !== "place") return state;
      const rest = state.myShips.filter((s) => s.id !== action.ship.id);
      if (!canAddShip(rest, action.ship)) return state;
      return { ...state, myShips: [...rest, action.ship] };
    }
    case "REMOVE_SHIP": {
      if (state.phase !== "place") return state;
      return {
        ...state,
        myShips: state.myShips.filter((s) => s.id !== action.id),
      };
    }
    case "ADVANCE_PLACEMENT": {
      if (state.phase !== "place") return state;
      if (!fleetIsCompleteAndValid(state.myShips)) return state;
      if (state.mode === "single") {
        return {
          ...state,
          phase: "play",
          single: {
            botShips: randomBotFleet(),
            playerShots: emptyShotGrid(),
            botShots: emptyShotGrid(),
            selectedTarget: null,
            turn: "player",
            lastBotShot: null,
          },
          winner: null,
          trackerShotGrid: emptyShotGrid(),
          trackerPending: null,
          trackerManualMisses: new Set(),
        };
      }
      return {
        ...state,
        phase: "play",
        trackerShotGrid: emptyShotGrid(),
        trackerPending: null,
        trackerManualMisses: new Set(),
        single: null,
        winner: null,
      };
    }
    case "TRACKER_SELECT": {
      if (state.phase !== "play" || state.mode !== "twoPlayerTracker") return state;
      const { r, c } = action.cell;
      if (state.trackerPending?.r === r && state.trackerPending?.c === c) {
        return { ...state, trackerPending: null };
      }
      return { ...state, trackerPending: { r, c } };
    }
    case "TRACKER_CLEAR_SELECT":
      return state.phase !== "play" || state.mode !== "twoPlayerTracker"
        ? state
        : { ...state, trackerPending: null };
    case "TRACKER_MARK": {
      if (
        state.phase !== "play" ||
        state.mode !== "twoPlayerTracker" ||
        !state.trackerPending
      ) {
        return state;
      }
      const { r, c } = state.trackerPending;
      if (state.trackerShotGrid[r][c] !== "empty") return state;
      if (action.mark === "miss") {
        const shotGrid = cloneShotGrid(state.trackerShotGrid);
        shotGrid[r][c] = "miss";
        const nextManual = new Set(state.trackerManualMisses);
        nextManual.add(`${r},${c}`);
        return { ...state, trackerShotGrid: shotGrid, trackerPending: null, trackerManualMisses: nextManual };
      }
      const shotGrid = shotGridAfterHit(state.trackerShotGrid, r, c);
      return { ...state, trackerShotGrid: shotGrid, trackerPending: null };
    }
    case "TRACKER_SUNK": {
      if (
        state.phase !== "play" ||
        state.mode !== "twoPlayerTracker" ||
        !state.trackerPending
      ) {
        return state;
      }
      const { r, c } = state.trackerPending;
      if (state.trackerShotGrid[r][c] !== "hit") return state;
      if (!hasOrthoHitNeighbor(state.trackerShotGrid, r, c)) return state;
      const hull = orthoHitComponent(state.trackerShotGrid, r, c);
      const shotGrid = applyVersenktHull(state.trackerShotGrid, hull);
      return { ...state, trackerShotGrid: shotGrid, trackerPending: null };
    }
    case "TRACKER_UNDO": {
      if (
        state.phase !== "play" ||
        state.mode !== "twoPlayerTracker" ||
        !state.trackerPending
      ) {
        return state;
      }
      const { r, c } = state.trackerPending;
      const cellShot = state.trackerShotGrid[r][c];
      if (cellShot === "empty") return state;
      const { nextGrid, nextManual } = undoTrackerCell(
        state.trackerShotGrid, r, c, state.trackerManualMisses,
      );
      return {
        ...state,
        trackerShotGrid: nextGrid,
        trackerManualMisses: nextManual,
        trackerPending: null,
      };
    }
    case "SINGLE_SELECT_TARGET": {
      if (state.phase !== "play" || state.mode !== "single" || !state.single) return state;
      if (state.single.turn !== "player") return state;
      const { r, c } = action.cell;
      if (state.single.playerShots[r][c] !== "empty") return state;
      return {
        ...state,
        single: {
          ...state.single,
          selectedTarget: action.cell,
        },
      };
    }
    case "SINGLE_CLEAR_TARGET": {
      if (state.phase !== "play" || state.mode !== "single" || !state.single) return state;
      return {
        ...state,
        single: {
          ...state.single,
          selectedTarget: null,
        },
      };
    }
    case "SINGLE_FIRE": {
      if (state.phase !== "play" || state.mode !== "single" || !state.single) return state;
      if (state.single.turn !== "player" || !state.single.selectedTarget) return state;
      const { r, c } = state.single.selectedTarget;
      if (state.single.playerShots[r][c] !== "empty") return state;

      const nextShots = cloneShotGrid(state.single.playerShots);
      const isHit = state.single.botShips.some((ship) =>
        ship.cells.some((cell) => cell.r === r && cell.c === c),
      );
      nextShots[r][c] = isHit ? "hit" : "miss";

      let resolvedShots = nextShots;
      if (isHit) {
        const sunk = findNewlySunkShips(state.single.botShips, nextShots);
        for (const ship of sunk) {
          resolvedShots = applySunkSurround(state.single.botShips, ship, resolvedShots);
        }
      }

      const didWin = allFleetDestroyed(state.single.botShips, resolvedShots);
      return {
        ...state,
        phase: didWin ? "finished" : "play",
        winner: didWin ? "player" : null,
        single: {
          ...state.single,
          playerShots: resolvedShots,
          selectedTarget: null,
          turn: didWin ? "player" : isHit ? "player" : "bot",
          lastBotShot: null,
        },
      };
    }
    case "SINGLE_BOT_SHOT": {
      if (state.phase !== "play" || state.mode !== "single" || !state.single) return state;
      if (state.single.turn !== "bot") return state;
      const { r, c } = action.cell;
      if (state.single.botShots[r][c] !== "empty") return state;

      const nextShots = cloneShotGrid(state.single.botShots);
      const hitShip =
        state.myShips.find((ship) =>
          ship.cells.some((cell) => cell.r === r && cell.c === c),
        ) ?? null;
      const isHit = hitShip !== null;
      nextShots[r][c] = isHit ? "hit" : "miss";

      let resolvedShots = nextShots;
      let result: "hit" | "miss" | "sunk" = isHit ? "hit" : "miss";
      if (isHit) {
        const sunk = findNewlySunkShips(state.myShips, nextShots);
        const lastKey = `${r},${c}`;
        for (const ship of sunk) {
          if (ship.cells.some((cell) => `${cell.r},${cell.c}` === lastKey)) {
            result = "sunk";
          }
          resolvedShots = applySunkSurround(state.myShips, ship, resolvedShots);
        }
      }

      const botWon = allFleetDestroyed(state.myShips, resolvedShots);
      return {
        ...state,
        phase: botWon ? "finished" : "play",
        winner: botWon ? "bot" : null,
        single: {
          ...state.single,
          botShots: resolvedShots,
          turn: botWon ? "bot" : isHit ? "bot" : "player",
          lastBotShot: {
            cell: action.cell,
            result,
            hitShipId: hitShip?.id ?? null,
          },
        },
      };
    }
    default:
      return state;
  }
}
