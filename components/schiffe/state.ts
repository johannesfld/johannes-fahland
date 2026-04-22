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
import { randomBotFleet } from "@/components/schiffe/bot";
import type { GameAction, GameState } from "@/components/schiffe/types";

export const initialGame = (): GameState => ({
  mode: null,
  phase: "modeSelect",
  myShips: [],
  trackerShotGrid: emptyShotGrid(),
  trackerPending: null,
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
        };
      }
      return {
        ...state,
        phase: "play",
        trackerShotGrid: emptyShotGrid(),
        trackerPending: null,
        single: null,
        winner: null,
      };
    }
    case "TRACKER_SELECT": {
      if (state.phase !== "play" || state.mode !== "twoPlayerTracker") return state;
      const { r, c } = action.cell;
      const cell = state.trackerShotGrid[r][c];
      if (cell === "miss") return state;
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
        return { ...state, trackerShotGrid: shotGrid, trackerPending: null };
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
