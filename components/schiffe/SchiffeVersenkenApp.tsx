"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { FLEET, GRID_SIZE, type FleetShipId } from "@/lib/schiffe/constants";
import { colLabel, formatCell, rowLabel, type Cell } from "@/lib/schiffe/coords";
import {
  canAddShip,
  emptyShotGrid,
  fleetIsCompleteAndValid,
  segmentCenteredOnPoint,
  segmentCoveringCell,
  type PlacedShip,
  type Shot,
} from "@/lib/schiffe/rules";
import {
  applyVersenktHull,
  fiveHitSegmentContaining,
  hasOrthoHitNeighbor,
  orthoHitComponent,
} from "@/lib/schiffe/tracking";
import {
  loadColorSettings,
  normalizeHexInput,
  saveColorSettings,
  type SchiffeColorSettings,
} from "@/lib/schiffe/settings";

type Phase = "place" | "play";

type GameState = {
  phase: Phase;
  myShips: PlacedShip[];
  shotGrid: Shot[][];
  pending: Cell | null;
};

const initialGame = (): GameState => ({
  phase: "place",
  myShips: [],
  shotGrid: emptyShotGrid(),
  pending: null,
});

type GameAction =
  | { type: "RESET" }
  | { type: "PLACE_SHIP"; ship: PlacedShip }
  | { type: "REMOVE_SHIP"; id: FleetShipId }
  | { type: "ADVANCE_PLACEMENT" }
  | { type: "TRACK_SELECT"; cell: Cell }
  | { type: "TRACK_CLEAR_SELECT" }
  | { type: "TRACK_MARK"; mark: "hit" | "miss" }
  | { type: "TRACK_SUNK" };

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

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "RESET":
      return initialGame();
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
      return {
        ...state,
        phase: "play",
        shotGrid: emptyShotGrid(),
        pending: null,
      };
    }
    case "TRACK_SELECT": {
      if (state.phase !== "play") return state;
      const { r, c } = action.cell;
      const cell = state.shotGrid[r][c];
      if (cell === "miss") return state;
      return { ...state, pending: { r, c } };
    }
    case "TRACK_CLEAR_SELECT":
      return state.phase !== "play"
        ? state
        : { ...state, pending: null };
    case "TRACK_MARK": {
      if (state.phase !== "play" || !state.pending) return state;
      const { r, c } = state.pending;
      if (state.shotGrid[r][c] !== "empty") return state;
      if (action.mark === "miss") {
        const shotGrid = cloneShotGrid(state.shotGrid);
        shotGrid[r][c] = "miss";
        return { ...state, shotGrid, pending: null };
      }
      const shotGrid = shotGridAfterHit(state.shotGrid, r, c);
      return { ...state, shotGrid, pending: null };
    }
    case "TRACK_SUNK": {
      if (state.phase !== "play" || !state.pending) return state;
      const { r, c } = state.pending;
      if (state.shotGrid[r][c] !== "hit") return state;
      if (!hasOrthoHitNeighbor(state.shotGrid, r, c)) return state;
      const hull = orthoHitComponent(state.shotGrid, r, c);
      const shotGrid = applyVersenktHull(state.shotGrid, hull);
      return { ...state, shotGrid, pending: null };
    }
    default:
      return state;
  }
}

function shipAt(ships: PlacedShip[], r: number, c: number): PlacedShip | null {
  for (const s of ships) {
    if (s.cells.some((x) => x.r === r && x.c === c)) return s;
  }
  return null;
}

function placedShipIsVertical(s: PlacedShip): boolean {
  if (s.cells.length < 2) return false;
  const c0 = s.cells[0].c;
  return s.cells.every((x) => x.c === c0);
}

/** Neues Segment nach Orientierungswechsel; Reihenfolge: Mitte beibehalten, dann über alte Zellen legen, dann leicht verschieben. */
function cellsAfterRotateShip(
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

  const centered = segmentCenteredOnPoint(
    fracR,
    fracC,
    spec.len,
    newVertical,
  );
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

const PLACEMENT_ROTATE_BTN_PX = 36;

function emptyPlacementCellRefGrid(): (HTMLButtonElement | null)[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null as HTMLButtonElement | null),
  );
}

function BoardGrid({
  rootRef,
  innerRef,
  dimmed,
  renderCell,
  overlay,
}: {
  rootRef?: React.RefObject<HTMLDivElement | null>;
  innerRef?: React.RefObject<HTMLDivElement | null>;
  dimmed?: boolean;
  renderCell: (r: number, c: number) => React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <div
      ref={rootRef}
      className={[
        "relative w-full max-w-[min(22rem,calc(100vw-1.5rem))] touch-manipulation sm:max-w-[min(24rem,calc(100vw-2rem))] lg:max-w-[min(30rem,min(42vw,36rem)))] xl:max-w-[34rem]",
        dimmed ? "opacity-55" : "opacity-100",
      ].join(" ")}
    >
      <div className="flex w-full flex-col gap-0.5 sm:gap-1">
        <div className="flex w-full gap-0.5 sm:gap-1">
          <div className="w-5 shrink-0 sm:w-6 lg:w-7" />
          <div className="grid min-w-0 flex-1 grid-cols-10 gap-0.5 sm:gap-1">
            {Array.from({ length: GRID_SIZE }, (_, c) => (
              <div
                key={`h-${c}`}
                className="flex aspect-square min-h-0 min-w-0 items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 sm:text-xs lg:text-sm"
              >
                {colLabel(c)}
              </div>
            ))}
          </div>
        </div>
        <div className="flex w-full min-w-0 gap-0.5 sm:gap-1">
          <div className="flex w-5 shrink-0 flex-col gap-0.5 sm:w-6 sm:gap-1 lg:w-7">
            {Array.from({ length: GRID_SIZE }, (_, r) => (
              <div
                key={`v-${r}`}
                className="flex aspect-square min-h-0 min-w-0 items-center justify-end pr-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 sm:text-xs lg:text-sm"
              >
                {rowLabel(r)}
              </div>
            ))}
          </div>
          <div
            ref={innerRef}
            className="grid aspect-square min-h-0 w-0 min-w-0 flex-1 grid-cols-10 grid-rows-10 gap-0.5 sm:gap-1"
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
              const r = Math.floor(i / GRID_SIZE);
              const c = i % GRID_SIZE;
              return (
                <div key={`${r}-${c}`} className="min-h-0 min-w-0">
                  {renderCell(r, c)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {overlay}
    </div>
  );
}

export function SchiffeVersenkenApp() {
  const [game, dispatch] = useReducer(gameReducer, undefined, initialGame);
  const [colors, setColors] = useState<SchiffeColorSettings>(() =>
    loadColorSettings(),
  );
  const [hexDraft, setHexDraft] = useState<SchiffeColorSettings>(() =>
    loadColorSettings(),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vertical, setVertical] = useState(false);
  const [pickedId, setPickedId] = useState<FleetShipId | null>(null);
  /** Nur nach Tap auf ein bereits gesetztes Schiff auf dem Raster (Dreh-Button + Hervorhebung). */
  const [boardSelectedId, setBoardSelectedId] = useState<FleetShipId | null>(null);
  const [rotateBtnPos, setRotateBtnPos] = useState<{ left: number; top: number } | null>(
    null,
  );
  const placementBoardRootRef = useRef<HTMLDivElement>(null);
  const placementCellRefs = useRef<(HTMLButtonElement | null)[][]>(
    emptyPlacementCellRefGrid(),
  );

  const placing = game.phase === "place";

  const shipsHere = useMemo((): PlacedShip[] => {
    if (!placing) return [];
    return game.myShips;
  }, [placing, game.myShips]);

  useEffect(() => {
    if (
      boardSelectedId &&
      !shipsHere.some((s) => s.id === boardSelectedId)
    ) {
      setBoardSelectedId(null);
    }
  }, [shipsHere, boardSelectedId]);

  useEffect(() => {
    setBoardSelectedId(null);
  }, [placing]);

  useLayoutEffect(() => {
    const root = placementBoardRootRef.current;
    if (!boardSelectedId || !root) {
      setRotateBtnPos(null);
      return;
    }
    const ship = shipsHere.find((s) => s.id === boardSelectedId);
    if (!ship) {
      setRotateBtnPos(null);
      return;
    }
    const measure = () => {
      const rEl = placementBoardRootRef.current;
      if (!rEl) return;
      const br = rEl.getBoundingClientRect();
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const { r, c } of ship.cells) {
        const el = placementCellRefs.current[r]?.[c];
        if (!el) {
          setRotateBtnPos(null);
          return;
        }
        const cr = el.getBoundingClientRect();
        minX = Math.min(minX, cr.left);
        minY = Math.min(minY, cr.top);
        maxX = Math.max(maxX, cr.right);
        maxY = Math.max(maxY, cr.bottom);
      }
      const relL = minX - br.left;
      const relT = minY - br.top;
      const relR = maxX - br.left;
      const relB = maxY - br.top;
      const gap = 8;
      const cw = br.width;
      const ch = br.height;
      const vert = placedShipIsVertical(ship);
      let left: number;
      let top: number;
      if (vert) {
        left = (relL + relR) / 2 - PLACEMENT_ROTATE_BTN_PX / 2;
        top =
          relB + gap + PLACEMENT_ROTATE_BTN_PX <= ch
            ? relB + gap
            : Math.max(0, relT - gap - PLACEMENT_ROTATE_BTN_PX);
      } else {
        top = (relT + relB) / 2 - PLACEMENT_ROTATE_BTN_PX / 2;
        left =
          relR + gap + PLACEMENT_ROTATE_BTN_PX <= cw
            ? relR + gap
            : Math.max(0, relL - gap - PLACEMENT_ROTATE_BTN_PX);
      }
      left = Math.min(
        Math.max(0, left),
        Math.max(0, cw - PLACEMENT_ROTATE_BTN_PX),
      );
      top = Math.min(
        Math.max(0, top),
        Math.max(0, ch - PLACEMENT_ROTATE_BTN_PX),
      );
      setRotateBtnPos({ left, top });
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [boardSelectedId, shipsHere, vertical]);

  const tryPlaceAt = useCallback(
    (through: Cell, clientX?: number, clientY?: number) => {
      if (!placing || !pickedId) return;
      const spec = FLEET.find((f) => f.id === pickedId);
      if (!spec) return;
      let fracR = through.r + 0.5;
      let fracC = through.c + 0.5;
      if (
        clientX != null &&
        clientY != null &&
        placementInnerRef.current
      ) {
        const rect = placementInnerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
          fracC = (x / rect.width) * GRID_SIZE;
          fracR = (y / rect.height) * GRID_SIZE;
        }
      }
      const cells = segmentCenteredOnPoint(fracR, fracC, spec.len, vertical);
      if (!cells) return;
      dispatch({ type: "PLACE_SHIP", ship: { id: pickedId, cells } });
    },
    [placing, pickedId, vertical],
  );

  const placementInnerRef = useRef<HTMLDivElement>(null);
  const [placementHover, setPlacementHover] = useState<{
    cells: Cell[];
    valid: boolean;
  } | null>(null);
  const [placementDrag, setPlacementDrag] = useState<{
    pointerId: number;
    shipId: FleetShipId;
  } | null>(null);
  const shipsHereRef = useRef(shipsHere);
  const verticalRef = useRef(vertical);
  useLayoutEffect(() => {
    shipsHereRef.current = shipsHere;
  }, [shipsHere]);
  useLayoutEffect(() => {
    verticalRef.current = vertical;
  }, [vertical]);
  const lastPointerRef = useRef<{ x: number; y: number; has: boolean }>({
    x: 0,
    y: 0,
    has: false,
  });

  const clientToPlacementFraction = useCallback(
    (clientX: number, clientY: number): { fracR: number; fracC: number } | null => {
      const el = placementInnerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
      return {
        fracC: (x / rect.width) * GRID_SIZE,
        fracR: (y / rect.height) * GRID_SIZE,
      };
    },
    [],
  );

  const updatePlacementHover = useCallback(
    (clientX: number, clientY: number, shipId: FleetShipId) => {
      const frac = clientToPlacementFraction(clientX, clientY);
      const spec = FLEET.find((f) => f.id === shipId);
      if (!frac || !spec) {
        setPlacementHover(null);
        return;
      }
      const cells = segmentCenteredOnPoint(
        frac.fracR,
        frac.fracC,
        spec.len,
        verticalRef.current,
      );
      if (!cells) {
        setPlacementHover(null);
        return;
      }
      const rest = shipsHereRef.current.filter((s) => s.id !== shipId);
      const valid = canAddShip(rest, { id: shipId, cells });
      setPlacementHover({ cells, valid });
    },
    [clientToPlacementFraction],
  );

  useEffect(() => {
    if (!placementDrag) return;
    const { pointerId, shipId } = placementDrag;
    const finish = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const frac = clientToPlacementFraction(e.clientX, e.clientY);
      setPlacementDrag(null);
      setPlacementHover(null);
      lastPointerRef.current = { x: 0, y: 0, has: false };
      if (!frac) return;
      const spec = FLEET.find((f) => f.id === shipId);
      if (!spec) return;
      const cells = segmentCenteredOnPoint(
        frac.fracR,
        frac.fracC,
        spec.len,
        verticalRef.current,
      );
      if (!cells) return;
      const rest = shipsHereRef.current.filter((s) => s.id !== shipId);
      if (!canAddShip(rest, { id: shipId, cells })) return;
      dispatch({ type: "PLACE_SHIP", ship: { id: shipId, cells } });
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      lastPointerRef.current = {
        x: e.clientX,
        y: e.clientY,
        has: true,
      };
      updatePlacementHover(e.clientX, e.clientY, shipId);
    };
    const onEnd = (e: PointerEvent) => finish(e);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [placementDrag, clientToPlacementFraction, updatePlacementHover]);

  useEffect(() => {
    if (!placementDrag || !lastPointerRef.current.has) return;
    updatePlacementHover(
      lastPointerRef.current.x,
      lastPointerRef.current.y,
      placementDrag.shipId,
    );
  }, [vertical, placementDrag, updatePlacementHover]);

  const placementPreviewKeys = useMemo(() => {
    if (!placementHover) return null;
    return new Set(placementHover.cells.map((x) => `${x.r},${x.c}`));
  }, [placementHover]);

  const showVersenktButton = useMemo(() => {
    if (game.phase !== "play" || !game.pending) return false;
    const { r, c } = game.pending;
    if (game.shotGrid[r][c] !== "hit") return false;
    return hasOrthoHitNeighbor(game.shotGrid, r, c);
  }, [game.phase, game.pending, game.shotGrid]);

  const markHitMissDisabled =
    game.phase !== "play" || !game.pending || game.shotGrid[game.pending.r][game.pending.c] !== "empty";

  const versenktHint = !game.pending
    ? "Versenkt: wähle ein rotes Trefferfeld mit mindestens einem roten Nachbarn (oben/unten/links/rechts)."
    : game.shotGrid[game.pending.r][game.pending.c] !== "hit"
      ? "Versenkt: wähle ein Trefferfeld."
      : !hasOrthoHitNeighbor(game.shotGrid, game.pending.r, game.pending.c)
        ? "Versenkt: nur wenn ein weiteres Trefferfeld direkt daneben liegt."
        : "Schiff als versenkt markieren (Wasser nur orthogonal um die Treffergruppe).";

  const persistColors = (next: SchiffeColorSettings) => {
    setColors(next);
    saveColorSettings(next);
  };

  useEffect(() => {
    if (!settingsOpen) return;
    setHexDraft({ hit: colors.hit, miss: colors.miss });
  }, [settingsOpen, colors.hit, colors.miss]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 overflow-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-[max(0.5rem,env(safe-area-inset-top,0px))] [padding-left:max(0.75rem,env(safe-area-inset-left,0px))] [padding-right:max(0.75rem,env(safe-area-inset-right,0px))] sm:gap-4 sm:px-4 lg:gap-5 lg:px-6">
      <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl lg:text-2xl">
            Schiffe versenken
          </h1>
          <p className="mt-1 max-w-prose text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 sm:text-xs lg:text-sm">
            Hilfsmittel fürs Brett: Flotte hier ablegen, danach am Tippfeld Treffer und Fehlschüsse vom
            Tischspiel eintragen.
          </p>
        </div>
        <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-800 shadow-sm active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:min-h-10 sm:min-w-[7.5rem]"
          >
            Einstellungen
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Spiel wirklich abbrechen und neu starten?")) {
                setBoardSelectedId(null);
                dispatch({ type: "RESET" });
              }
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-700 shadow-sm active:scale-[0.98] dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-300 sm:min-h-10 sm:min-w-[7.5rem]"
          >
            Neu
          </button>
        </div>
      </header>

      {settingsOpen && (
        <div className="shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-4 lg:mx-auto lg:max-w-3xl lg:p-5">
          <p className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 sm:text-sm">
            Farben (Schuss-Raster)
          </p>
          <p className="mb-3 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 sm:text-xs">
            Nur für die Anzeige auf{" "}
            <strong className="text-zinc-700 dark:text-zinc-300">diesem Gerät</strong>. Die Einstellungen
            bleiben hier gespeichert.
          </p>
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-[5.5rem] text-xs font-bold text-zinc-700 dark:text-zinc-200">
                Treffer
              </span>
              <input
                type="color"
                value={colors.hit}
                onChange={(e) => persistColors({ ...colors, hit: e.target.value })}
                className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white dark:border-zinc-600"
                aria-label="Farbe Treffer"
              />
              <input
                type="text"
                value={hexDraft.hit}
                onChange={(e) =>
                  setHexDraft((d) => ({ ...d, hit: e.target.value }))
                }
                onBlur={() => {
                  const parsed = normalizeHexInput(hexDraft.hit);
                  if (parsed) persistColors({ ...colors, hit: parsed });
                  else setHexDraft((d) => ({ ...d, hit: colors.hit }));
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const parsed = normalizeHexInput(hexDraft.hit);
                  if (parsed) persistColors({ ...colors, hit: parsed });
                  else setHexDraft((d) => ({ ...d, hit: colors.hit }));
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-[5.5rem] text-xs font-bold text-zinc-700 dark:text-zinc-200">
                Fehlschuss
              </span>
              <input
                type="color"
                value={colors.miss}
                onChange={(e) => persistColors({ ...colors, miss: e.target.value })}
                className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white dark:border-zinc-600"
                aria-label="Farbe Fehlschuss"
              />
              <input
                type="text"
                value={hexDraft.miss}
                onChange={(e) =>
                  setHexDraft((d) => ({ ...d, miss: e.target.value }))
                }
                onBlur={() => {
                  const parsed = normalizeHexInput(hexDraft.miss);
                  if (parsed) persistColors({ ...colors, miss: parsed });
                  else setHexDraft((d) => ({ ...d, miss: colors.miss }));
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const parsed = normalizeHexInput(hexDraft.miss);
                  if (parsed) persistColors({ ...colors, miss: parsed });
                  else setHexDraft((d) => ({ ...d, miss: colors.miss }));
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {game.phase === "place" && (
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden sm:gap-4">
            <div className="shrink-0 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-center text-xs font-semibold text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100 sm:px-4 sm:text-sm">
              Schiffe legen – danach wechselst du zum Tippfeld für das Spiel am Tisch.
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:flex-row lg:items-stretch lg:gap-8">
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto lg:max-w-md lg:shrink-0">
              <p className="text-pretty text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-left sm:text-xs lg:text-sm">
                Schiff in der Leiste oder auf dem Brett antippen,{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">ziehen zum Platzieren</strong>. Leeres Feld
                antippen legt das gewählte Schiff. Gesetztes Schiff auf dem Brett antippen: Auswahl und{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">↻</strong> zum Drehen.
              </p>
              <div className="flex touch-none flex-wrap justify-center gap-2 sm:justify-start lg:justify-start">
                {FLEET.map((f) => {
                  const placed = shipsHere.some((s) => s.id === f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setBoardSelectedId(null);
                        setPickedId(f.id);
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setBoardSelectedId(null);
                        setPickedId(f.id);
                        setPlacementDrag({
                          pointerId: e.pointerId,
                          shipId: f.id,
                        });
                        updatePlacementHover(e.clientX, e.clientY, f.id);
                      }}
                      className={[
                        "min-h-11 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors select-none touch-manipulation sm:min-h-10 sm:py-2",
                        placed
                          ? "cursor-grab border-sky-600 bg-sky-50 text-sky-950 active:cursor-grabbing dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-100"
                          : pickedId === f.id
                            ? "border-amber-500 bg-amber-100 text-amber-950 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100"
                            : "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
                      ].join(" ")}
                    >
                      {f.len}er
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap justify-center gap-2 pb-1 sm:justify-start">
                {shipsHere.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "REMOVE_SHIP",
                        id: s.id,
                      })
                    }
                    className="min-h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    {s.id} entfernen
                  </button>
                ))}
              </div>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-3 lg:min-w-0 lg:flex-1 lg:items-center lg:justify-start">
              <BoardGrid
                rootRef={placementBoardRootRef}
                innerRef={placementInnerRef}
                overlay={
                  boardSelectedId &&
                  shipsHere.some((s) => s.id === boardSelectedId) &&
                  rotateBtnPos ? (
                    <button
                      type="button"
                      aria-label="Schiff drehen"
                      title="Drehen"
                      className="absolute z-20 flex items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-lg leading-none text-zinc-800 shadow-lg ring-1 ring-black/10 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:shadow-black/50 dark:ring-white/10"
                      style={{
                        left: rotateBtnPos.left,
                        top: rotateBtnPos.top,
                        width: PLACEMENT_ROTATE_BTN_PX,
                        height: PLACEMENT_ROTATE_BTN_PX,
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!boardSelectedId || !placing) return;
                        const ship = shipsHere.find(
                          (s) => s.id === boardSelectedId,
                        );
                        if (!ship) return;
                        const newVertical = !placedShipIsVertical(ship);
                        const next = cellsAfterRotateShip(
                          ship,
                          newVertical,
                          shipsHere,
                        );
                        if (!next) return;
                        dispatch({
                          type: "PLACE_SHIP",
                          ship: { id: ship.id, cells: next },
                        });
                        setVertical(newVertical);
                      }}
                    >
                      ↻
                    </button>
                  ) : null
                }
                renderCell={(r, c) => {
                  const sh = shipAt(shipsHere, r, c);
                  const pk = `${r},${c}`;
                  const prev =
                    placementPreviewKeys?.has(pk) ?? false;
                  const prevOk = placementHover?.valid ?? false;
                  const selectedOnBoard = Boolean(
                    sh && boardSelectedId === sh.id,
                  );
                  return (
                    <button
                      type="button"
                      ref={(el) => {
                        placementCellRefs.current[r][c] = el;
                      }}
                      className={[
                        "relative h-full w-full rounded-md border text-[0px]",
                        sh
                          ? selectedOnBoard
                            ? "cursor-grab border-amber-600 bg-amber-400/95 ring-2 ring-amber-300/90 shadow-md active:cursor-grabbing dark:border-amber-400 dark:bg-amber-600/90 dark:ring-amber-400/60"
                            : "cursor-grab border-sky-700 bg-sky-600/90 active:cursor-grabbing dark:border-sky-400 dark:bg-sky-500/80"
                          : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800/80",
                        prev && prevOk
                          ? "ring-2 ring-amber-400/90 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900"
                          : "",
                        prev && !prevOk
                          ? "ring-2 ring-red-500/80 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900"
                          : "",
                      ].join(" ")}
                      onPointerDown={(e) => {
                        if (!sh) return;
                        e.preventDefault();
                        setBoardSelectedId(sh.id);
                        setPickedId(sh.id);
                        setVertical(placedShipIsVertical(sh));
                        setPlacementDrag({
                          pointerId: e.pointerId,
                          shipId: sh.id,
                        });
                        updatePlacementHover(e.clientX, e.clientY, sh.id);
                      }}
                      onClick={(e) => {
                        if (sh) {
                          setBoardSelectedId(sh.id);
                          setPickedId(sh.id);
                          setVertical(placedShipIsVertical(sh));
                          return;
                        }
                        setBoardSelectedId(null);
                        tryPlaceAt({ r, c }, e.clientX, e.clientY);
                      }}
                    >
                      {prev ? (
                        <span
                          className={[
                            "pointer-events-none absolute inset-0.5 rounded-sm opacity-40",
                            prevOk ? "bg-amber-300 dark:bg-amber-500/50" : "bg-red-400/60",
                          ].join(" ")}
                        />
                      ) : null}
                      <span className="sr-only">Feld {formatCell({ r, c })}</span>
                    </button>
                  );
                }}
              />
              </div>
            </div>
            <button
              type="button"
              disabled={!fleetIsCompleteAndValid(game.myShips)}
              onClick={() => dispatch({ type: "ADVANCE_PLACEMENT" })}
              className="mx-auto w-full max-w-md shrink-0 rounded-2xl bg-amber-500 py-3.5 text-sm font-black text-amber-950 shadow-md disabled:cursor-not-allowed disabled:opacity-40 sm:py-3 lg:max-w-sm dark:bg-amber-400 dark:text-amber-950"
            >
              Weiter zum Tippfeld
            </button>
          </div>
        )}

        {game.phase === "play" && (
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden sm:gap-4">
            <div className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-center text-[11px] font-semibold leading-snug text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 sm:px-4 sm:text-xs lg:mx-auto lg:max-w-4xl lg:text-sm">
              Am <strong className="text-zinc-900 dark:text-zinc-100">Tippfeld</strong> ein leeres oder rotes Feld
              wählen, dann <strong className="text-zinc-900 dark:text-zinc-100">Treffer</strong> /{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">Kein Treffer</strong>. Fünf Treffer in einer Reihe
              erhalten automatisch den Umriss. Zwei benachbarte Treffer:{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">Versenkt</strong>.
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-1 lg:grid lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-x-8 lg:gap-y-4 lg:overflow-hidden lg:pb-0">
              <div className="flex min-h-0 flex-col gap-3 lg:col-span-2 lg:grid lg:min-h-0 lg:grid-cols-2 lg:gap-x-8 lg:overflow-hidden">
                <section className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-2 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/40 lg:min-h-0 lg:overflow-y-auto lg:p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 sm:text-xs">
                    Deine Schiffe
                  </span>
                  <BoardGrid
                    dimmed={false}
                    renderCell={(r, c) => {
                      const sh = shipAt(game.myShips, r, c);
                      const bg = sh
                        ? "border-sky-800 bg-sky-700/90 dark:border-sky-300 dark:bg-sky-600/85"
                        : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800/80";
                      return (
                        <div className={`h-full w-full rounded-md border ${bg}`}>
                          <span className="sr-only">Feld {formatCell({ r, c })}</span>
                        </div>
                      );
                    }}
                  />
                </section>
                <section className="flex flex-col items-center gap-2 rounded-2xl border border-amber-300/80 bg-amber-50/50 p-2 sm:p-3 dark:border-amber-800/50 dark:bg-amber-950/20 lg:min-h-0 lg:overflow-y-auto lg:p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 sm:text-xs">
                    Tippfeld
                  </span>
                  <BoardGrid
                    dimmed={false}
                    renderCell={(r, c) => {
                      const shot = game.shotGrid[r][c];
                      const sel =
                        game.pending?.r === r && game.pending?.c === c;
                      return (
                        <button
                          type="button"
                          disabled={shot === "miss"}
                          onClick={() =>
                            dispatch({ type: "TRACK_SELECT", cell: { r, c } })
                          }
                          className={[
                            "h-full w-full rounded-md border",
                            shot === "empty"
                              ? "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800/80"
                              : "",
                            sel
                              ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900"
                              : "",
                          ].join(" ")}
                          style={
                            shot === "hit"
                              ? {
                                  backgroundColor: colors.hit,
                                  borderColor: colors.hit,
                                }
                              : shot === "miss"
                                ? {
                                    backgroundColor: colors.miss,
                                    borderColor: colors.miss,
                                  }
                                : undefined
                          }
                        >
                          <span className="sr-only">{formatCell({ r, c })}</span>
                        </button>
                      );
                    }}
                  />
                </section>
              </div>
              <div
                className="shrink-0 space-y-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/30 sm:p-4 lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-3xl"
                style={{
                  paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-center sm:gap-3">
                  <div className="flex min-h-11 flex-1 gap-2 sm:min-h-12 sm:max-w-md sm:flex-1 lg:max-w-xl">
                    <button
                      type="button"
                      disabled={markHitMissDisabled}
                      onClick={() => dispatch({ type: "TRACK_MARK", mark: "hit" })}
                      className="min-h-11 flex-1 rounded-xl py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-12 sm:text-sm"
                      style={{ backgroundColor: colors.hit }}
                    >
                      Treffer
                    </button>
                    <button
                      type="button"
                      disabled={markHitMissDisabled}
                      onClick={() => dispatch({ type: "TRACK_MARK", mark: "miss" })}
                      className="min-h-11 flex-1 rounded-xl border-2 border-zinc-400 py-2.5 text-xs font-black text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-500 dark:text-zinc-100 sm:min-h-12 sm:text-sm"
                      style={{ backgroundColor: colors.miss }}
                    >
                      Kein Treffer
                    </button>
                  </div>
                  {showVersenktButton ? (
                    <button
                      type="button"
                      title={versenktHint}
                      aria-label={versenktHint}
                      onClick={() => dispatch({ type: "TRACK_SUNK" })}
                      className="min-h-11 w-full rounded-xl border-2 border-amber-700 bg-amber-100 py-2.5 text-sm font-black text-amber-950 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-100 sm:min-h-12 sm:max-w-xs sm:flex-1 lg:max-w-[14rem]"
                    >
                      Versenkt
                    </button>
                  ) : null}
                </div>
                <p className="text-center text-[10px] leading-snug text-zinc-500 dark:text-zinc-400 sm:text-xs">
                  {versenktHint}
                </p>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "TRACK_CLEAR_SELECT" })}
                  className="w-full py-1.5 text-center text-[11px] font-semibold text-zinc-600 underline dark:text-zinc-400 sm:text-xs"
                >
                  Auswahl aufheben
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
