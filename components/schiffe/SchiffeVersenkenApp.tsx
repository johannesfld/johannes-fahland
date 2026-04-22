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
import { formatCell, type Cell } from "@/lib/schiffe/coords";
import {
  canAddShip,
  fleetIsCompleteAndValid,
  segmentCenteredOnPoint,
  type PlacedShip,
} from "@/lib/schiffe/rules";
import { hasOrthoHitNeighbor } from "@/lib/schiffe/tracking";
import {
  DEFAULT_COLORS,
  loadColorSettings,
  normalizeHexInput,
  saveColorSettings,
  type SchiffeColorSettings,
} from "@/lib/schiffe/settings";
import {
  PLACEMENT_OVERLAY_GAP_PX,
  PLACEMENT_ROTATE_BTN_PX,
} from "@/components/schiffe/constants";
import { chooseBotShot } from "@/components/schiffe/bot";
import {
  cellsAfterRotateShip,
  emptyPlacementCellRefGrid,
  placedShipIsVertical,
  shipAt,
} from "@/components/schiffe/logic";
import { gameReducer, initialGame } from "@/components/schiffe/state";
import type {
  BotShotFeedback,
  GameMode,
  PlayBoardTab,
} from "@/components/schiffe/types";
import { schiffeCard as card, schiffeGlow as glow, schiffeShell as shell } from "@/components/schiffe/styles";

const alphabetLabels = Array.from({ length: GRID_SIZE }, (_, c) =>
  String.fromCharCode(65 + c),
);
const boardCellGapPx = 2;

function BoardGrid({
  onRootRef,
  innerRef,
  overlay,
  renderCell,
  dimmed = false,
  panelClassName,
}: {
  onRootRef?: (el: HTMLDivElement | null) => void;
  innerRef?: React.RefObject<HTMLDivElement | null>;
  overlay?: React.ReactNode;
  renderCell: (r: number, c: number) => React.ReactNode;
  dimmed?: boolean;
  panelClassName?: string;
}) {
  const localRootRef = useRef<HTMLDivElement | null>(null);
  const [fitMaxWidthPx, setFitMaxWidthPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const rootEl = localRootRef.current;
    const parentEl = rootEl?.parentElement;
    if (!rootEl || !parentEl) return;
    const measure = () => {
      const maxByParent = Math.min(parentEl.clientWidth, parentEl.clientHeight);
      if (!Number.isFinite(maxByParent) || maxByParent <= 0) return;
      setFitMaxWidthPx(Math.max(140, Math.floor(maxByParent)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parentEl);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={(el) => {
        localRootRef.current = el;
        onRootRef?.(el);
      }}
      className={`relative w-full max-h-full max-w-full rounded-2xl border border-slate-700/60 bg-slate-950/95 p-1.5 shadow-md transition-opacity duration-200 sm:p-2 ${
        dimmed ? "opacity-40" : "opacity-100"
      }`}
      style={fitMaxWidthPx ? { maxWidth: `${fitMaxWidthPx}px` } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.2)_0%,transparent_75%)]" />
      </div>
      <div className={`relative ${panelClassName ?? ""}`}>
        <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-0.5 sm:grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-1">
          <div />
          <div className="grid grid-cols-10 gap-0.5 sm:gap-1">
            {alphabetLabels.map((letter) => (
              <div
                key={letter}
                className="flex h-4 items-center justify-center rounded-sm bg-slate-900/70 font-mono text-[8px] font-bold text-slate-400 sm:h-5 sm:text-[10px]"
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="grid h-full grid-rows-10 gap-0.5 sm:gap-1">
            {Array.from({ length: GRID_SIZE }, (_, r) => (
              <div
                key={r}
                className="flex min-h-0 items-center justify-center rounded-sm bg-slate-900/70 font-mono text-[8px] font-bold text-slate-400 sm:text-[10px]"
              >
                {r + 1}
              </div>
            ))}
          </div>
          <div
            ref={innerRef}
            className="board-grid grid aspect-square flex-1 grid-cols-10 grid-rows-10 gap-[2px] rounded-md border border-slate-700/70 bg-slate-900/80 p-[2px]"
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
              const r = Math.floor(i / GRID_SIZE);
              const c = i % GRID_SIZE;
              return (
                <div
                  key={`${r}-${c}`}
                  className="relative rounded-[2px] bg-slate-950/90"
                >
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
  const [mobilePlayBoard, setMobilePlayBoard] = useState<PlayBoardTab>("target");
  const [mobilePlacePanel, setMobilePlacePanel] = useState<"board" | "fleet">("board");
  const [botOverlayEntered, setBotOverlayEntered] = useState(false);
  const [vertical, setVertical] = useState(false);
  const [pickedId, setPickedId] = useState<FleetShipId | null>(null);
  const [boardSelectedId, setBoardSelectedId] = useState<FleetShipId | null>(null);
  const [rotateBtnPos, setRotateBtnPos] = useState<{ left: number; top: number } | null>(
    null,
  );
  const placementBoardRootRef = useRef<HTMLDivElement>(null);
  const placementCellRefs = useRef<(HTMLButtonElement | null)[][]>(
    emptyPlacementCellRefGrid(),
  );
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const modeLabel =
    game.mode === "single" ? "1 Spieler vs Bot" : "2 Spieler Tracker";

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBoardSelectedId(null);
    }
  }, [shipsHere, boardSelectedId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoardSelectedId(null);
  }, [placing]);

  useLayoutEffect(() => {
    const root = placementBoardRootRef.current;
    if (!boardSelectedId || !root) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      const gap = PLACEMENT_OVERLAY_GAP_PX;
      const cw = br.width;
      const ch = br.height;
      const clusterW = PLACEMENT_ROTATE_BTN_PX * 2 + gap;
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
      left = Math.min(Math.max(0, left), Math.max(0, cw - clusterW));
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
  const dragCaptureRef = useRef<Element | null>(null);

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
    const releaseCap = () => {
      const el = dragCaptureRef.current;
      if (el) {
        try { el.releasePointerCapture(pointerId); } catch { /* already released */ }
        dragCaptureRef.current = null;
      }
    };
    const finish = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      releaseCap();
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
      releaseCap();
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
    if (game.phase !== "play" || game.mode !== "twoPlayerTracker" || !game.trackerPending) {
      return false;
    }
    const { r, c } = game.trackerPending;
    if (game.trackerShotGrid[r][c] !== "hit") return false;
    return hasOrthoHitNeighbor(game.trackerShotGrid, r, c);
  }, [game]);

  const markHitMissDisabled =
    game.phase !== "play" ||
    game.mode !== "twoPlayerTracker" ||
    !game.trackerPending ||
    game.trackerShotGrid[game.trackerPending.r][game.trackerPending.c] !== "empty";

  const persistColors = (next: SchiffeColorSettings) => {
    setColors(next);
    saveColorSettings(next);
  };

  useEffect(() => {
    if (!settingsOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHexDraft({ hit: colors.hit, miss: colors.miss });
  }, [settingsOpen, colors.hit, colors.miss]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      if (settingsBtnRef.current?.contains(target)) return;
      if (settingsRef.current?.contains(target)) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [settingsOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (game.phase === "play") setMobilePlayBoard("target");
  }, [game.phase]);

  useEffect(() => {
    if (game.phase !== "place") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobilePlacePanel("board");
  }, [game.phase]);

  useEffect(() => {
    if (
      game.phase !== "play" ||
      game.mode !== "single" ||
      !game.single ||
      game.single.turn !== "bot"
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      const botCell = chooseBotShot(game.single!.botShots);
      dispatch({ type: "SINGLE_BOT_SHOT", cell: botCell });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [game.phase, game.mode, game.single]);

  useEffect(() => {
    if (!game.single?.lastBotShot) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBotOverlayEntered(false);
    const raf = window.requestAnimationFrame(() => {
      setBotOverlayEntered(true);
    });
    const timer = window.setTimeout(() => {
      dispatch({ type: "CLEAR_BOT_FEEDBACK" });
    }, 1000);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [game.single?.lastBotShot]);

  const botShotFeedbackText = (feedback: BotShotFeedback): string => {
    const cell = formatCell(feedback.cell);
    if (feedback.result === "sunk") return `Bot feuert auf ${cell}: Versenkt.`;
    if (feedback.result === "hit") return `Bot feuert auf ${cell}: Treffer.`;
    return `Bot feuert auf ${cell}: Kein Treffer.`;
  };

  const shipLabelById = (shipId: FleetShipId | null): string => {
    if (!shipId) return "-";
    const spec = FLEET.find((x) => x.id === shipId);
    if (!spec) return "-";
    return `${spec.len}er (${shipId.toUpperCase()})`;
  };

  const botShotWasHit = (feedback: BotShotFeedback): boolean =>
    feedback.result === "hit" || feedback.result === "sunk";

  const botShotWasSunk = (feedback: BotShotFeedback): boolean =>
    feedback.result === "sunk";

  const yesNoLabel = (value: boolean): "Ja" | "Nein" => (value ? "Ja" : "Nein");

  const overlayRowValueClass = (active: boolean): string =>
    active
      ? "font-black"
      : "font-semibold text-slate-700 dark:text-slate-300";

  const overlayCellLabel = (feedback: BotShotFeedback): string =>
    formatCell(feedback.cell);

  const overlayHitLabel = (feedback: BotShotFeedback): "Ja" | "Nein" =>
    yesNoLabel(botShotWasHit(feedback));

  const overlaySunkLabel = (feedback: BotShotFeedback): "Ja" | "Nein" =>
    yesNoLabel(botShotWasSunk(feedback));

  const overlayShipLabel = (feedback: BotShotFeedback): string =>
    shipLabelById(feedback.hitShipId);

  const overlayBadgeLabel = (feedback: BotShotFeedback): string => {
    if (botShotWasSunk(feedback)) return "Treffer + Versenkt";
    if (botShotWasHit(feedback)) return "Treffer";
    return "Kein Treffer";
  };

  const modeSelectCard = (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className={`${card} w-full max-w-3xl space-y-4 p-4 sm:p-6`}>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Moduswahl
          </p>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            Schiffe versenken starten
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Wähle, ob du gegen den Bot spielst oder das manuelle 2-Spieler-Tippfeld
            nutzt.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_MODE", mode: "single" })}
            className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-left shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50/90 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 dark:border-slate-600/50 dark:bg-slate-900/70 dark:hover:border-slate-400 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-zinc-950"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
              1 Spieler
            </p>
            <p className="mt-1 font-sans text-xl font-black text-slate-900 dark:text-slate-100">
              Gegen Bot
            </p>
            <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">
              Bot-Flotte wird zufällig gesetzt. Du feuerst pro Zug mit einem Button.
            </p>
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_MODE", mode: "twoPlayerTracker" })}
            className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-left shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50/90 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 dark:border-slate-600/50 dark:bg-slate-900/70 dark:hover:border-slate-400 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-zinc-950"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
              2 Spieler
            </p>
            <p className="mt-1 font-sans text-xl font-black text-slate-900 dark:text-slate-100">
              Gegen Spieler
            </p>
            <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">
              Ein simpler Ersatz für das Spielfeld. Jeder Spieler öffnet diese Seite auf seinem Smartphone.
            </p>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={shell}>
      <div className={glow} />
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 overflow-hidden px-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.5rem,env(safe-area-inset-top,0px))] [padding-left:max(0.5rem,env(safe-area-inset-left,0px))] [padding-right:max(0.5rem,env(safe-area-inset-right,0px))] sm:px-4 lg:px-6">
        <header className="flex shrink-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="hidden text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 sm:block dark:text-slate-400">
              Taktikspiel
            </p>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-800 sm:text-2xl lg:text-3xl dark:text-white">
              Schiffe versenken
            </h1>
            {game.phase !== "modeSelect" && (
              <p className="text-[11px] font-semibold text-slate-700 sm:text-xs dark:text-slate-300">
                {modeLabel}
              </p>
            )}
          </div>
          <button
            ref={settingsBtnRef}
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-2 text-[11px] font-bold text-zinc-800 shadow-sm transition duration-200 hover:bg-zinc-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:px-4 sm:text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
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
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white px-2 text-[11px] font-bold text-red-700 shadow-sm transition duration-200 hover:bg-red-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:px-4 sm:text-xs dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
          >
            Neu
          </button>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {settingsOpen && (
            <div
              ref={settingsRef}
              className="absolute inset-x-0 top-0 z-30 mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30"
            >
              <p className="mb-2 text-xs font-semibold text-zinc-700 sm:text-sm dark:text-zinc-200">
                Farben (Schuss-Raster)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="min-w-[5rem] text-xs font-bold text-zinc-700 dark:text-zinc-200">
                    Treffer
                  </span>
                  <input
                    type="color"
                    value={colors.hit}
                    onChange={(e) => persistColors({ ...colors, hit: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-300 bg-white dark:border-zinc-600"
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
                    className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="min-w-[5rem] text-xs font-bold text-zinc-700 dark:text-zinc-200">
                    Fehlschuss
                  </span>
                  <input
                    type="color"
                    value={colors.miss}
                    onChange={(e) => persistColors({ ...colors, miss: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-300 bg-white dark:border-zinc-600"
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
                    className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => persistColors(DEFAULT_COLORS)}
                className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 transition duration-200 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Farben zuruecksetzen
              </button>
            </div>
          )}

          {game.phase === "modeSelect" && modeSelectCard}

          {game.phase === "place" && (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <p className="shrink-0 rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-700 sm:text-xs dark:border-slate-700/50 dark:bg-slate-900/50 dark:text-slate-200">
                Schiff wählen, dann aufs Feld tippen zum Setzen. Ziehen geht auch. Anklicken zum Drehen.
              </p>
              <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-4">
                <div className="order-2 flex shrink-0 items-center gap-2 overflow-x-auto py-1 lg:order-1 lg:w-28 lg:flex-col lg:items-stretch lg:gap-2 lg:overflow-visible lg:py-0">
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
                          (e.currentTarget as Element).setPointerCapture(e.pointerId);
                          dragCaptureRef.current = e.currentTarget;
                          setBoardSelectedId(null);
                          setPickedId(f.id);
                          setPlacementDrag({
                            pointerId: e.pointerId,
                            shipId: f.id,
                          });
                          updatePlacementHover(e.clientX, e.clientY, f.id);
                        }}
                        className={[
                          "shrink-0 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition duration-200 select-none touch-manipulation active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:px-4 sm:text-xs lg:w-full dark:focus-visible:ring-offset-zinc-950",
                          placed
                            ? "cursor-grab border-slate-500 bg-slate-50 text-slate-950 active:cursor-grabbing dark:border-slate-400 dark:bg-slate-900/40 dark:text-slate-100"
                            : pickedId === f.id
                              ? "border-amber-500 bg-amber-100 text-amber-950 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100"
                              : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600",
                        ].join(" ")}
                      >
                        {f.len}er
                      </button>
                    );
                  })}
                </div>
                <div
                  className="order-1 flex min-h-0 flex-1 items-center justify-center lg:order-2"
                  style={placementDrag ? { touchAction: "none" } : undefined}
                >
                  <BoardGrid
                    onRootRef={(el) => {
                      placementBoardRootRef.current = el;
                    }}
                    innerRef={placementInnerRef}
                    overlay={
                      boardSelectedId &&
                      shipsHere.some((s) => s.id === boardSelectedId) &&
                      rotateBtnPos ? (
                        <div
                          className="absolute z-20 flex items-center gap-2"
                          style={{
                            left: rotateBtnPos.left,
                            top: rotateBtnPos.top,
                          }}
                        >
                          <button
                            type="button"
                            aria-label="Schiff drehen"
                            title="Drehen"
                            className="flex items-center justify-center rounded-xl border border-slate-500/60 bg-slate-800/90 text-lg leading-none text-slate-100 shadow-lg backdrop-blur-sm transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                            style={{
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
                          <button
                            type="button"
                            aria-label="Schiff entfernen"
                            title="Entfernen"
                            className="flex items-center justify-center rounded-xl border border-red-500/40 bg-slate-800/90 text-base font-black leading-none text-red-400 shadow-lg backdrop-blur-sm transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                            style={{
                              width: PLACEMENT_ROTATE_BTN_PX,
                              height: PLACEMENT_ROTATE_BTN_PX,
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!boardSelectedId) return;
                              dispatch({
                                type: "REMOVE_SHIP",
                                id: boardSelectedId,
                              });
                              setBoardSelectedId(null);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ) : null
                    }
                    renderCell={(r, c) => {
                      const sh = shipAt(shipsHere, r, c);
                      const pk = `${r},${c}`;
                      const prev = placementPreviewKeys?.has(pk) ?? false;
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
                            "group relative h-full w-full touch-manipulation transition-colors text-[0px]",
                            !sh && !prev ? "hover:bg-slate-800/70" : "",
                          ].join(" ")}
                          onPointerDown={(e) => {
                            if (!sh) return;
                            e.preventDefault();
                            (e.currentTarget as Element).setPointerCapture(e.pointerId);
                            dragCaptureRef.current = e.currentTarget;
                            setBoardSelectedId(sh.id);
                            setPickedId(sh.id);
                            setVertical(placedShipIsVertical(sh));
                            setPlacementDrag({
                              pointerId: e.pointerId,
                              shipId: sh.id,
                            });
                            updatePlacementHover(e.clientX, e.clientY, sh.id);
                          }}
                          onClick={() => {
                            if (sh) {
                              setBoardSelectedId(sh.id);
                              setPickedId(sh.id);
                              setVertical(placedShipIsVertical(sh));
                              return;
                            }
                            if (!pickedId) return;
                            const spec = FLEET.find((fl) => fl.id === pickedId);
                            if (!spec) return;
                            const cells = segmentCenteredOnPoint(
                              r + 0.5, c + 0.5, spec.len, vertical,
                            );
                            if (!cells) return;
                            const rest = shipsHere.filter((s) => s.id !== pickedId);
                            if (!canAddShip(rest, { id: pickedId, cells })) return;
                            dispatch({ type: "PLACE_SHIP", ship: { id: pickedId, cells } });
                            setPickedId(null);
                            setBoardSelectedId(null);
                          }}
                        >
                          {sh && sh.cells[0].r === r && sh.cells[0].c === c && (
                            <div
                              className="pointer-events-none absolute left-0 top-0 z-20"
                              style={{
                                width: placedShipIsVertical(sh)
                                  ? "100%"
                                  : `calc(${sh.cells.length * 100}% + ${(sh.cells.length - 1) * boardCellGapPx}px)`,
                                height: placedShipIsVertical(sh)
                                  ? `calc(${sh.cells.length * 100}% + ${(sh.cells.length - 1) * boardCellGapPx}px)`
                                  : "100%",
                              }}
                            >
                              <ShipVisual
                                len={sh.cells.length}
                                vertical={placedShipIsVertical(sh)}
                                isSelected={selectedOnBoard}
                              />
                            </div>
                          )}
                          {prev && (
                            <div
                              className={`absolute inset-0.5 z-10 rounded-sm opacity-40 ${
                                prevOk ? "bg-amber-400" : "bg-red-500"
                              }`}
                            />
                          )}
                          {!sh && !prev && (
                            <div className="absolute left-1/2 top-1/2 h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-600 opacity-60" />
                          )}
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
                className="shrink-0 rounded-2xl bg-amber-500 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm transition duration-200 hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:py-2.5 sm:text-sm dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 dark:focus-visible:ring-offset-zinc-950"
              >
                {game.mode === "single" ? "Spiel starten" : "Weiter zum Tippfeld"}
              </button>
            </div>
          )}

          {game.phase === "play" && (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="grid shrink-0 grid-cols-2 gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobilePlayBoard("target")}
                  className={[
                    "min-h-10 rounded-xl border px-2 text-[11px] font-bold transition duration-200 active:scale-[0.98]",
                    mobilePlayBoard === "target"
                      ? "border-amber-500 bg-amber-100 text-amber-950 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100"
                      : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
                  ].join(" ")}
                >
                  {game.mode === "single" ? "Zielfeld" : "Tippfeld"}
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePlayBoard("fleet")}
                  className={[
                    "min-h-10 rounded-xl border px-2 text-[11px] font-bold transition duration-200 active:scale-[0.98]",
                    mobilePlayBoard === "fleet"
                      ? "border-slate-500 bg-slate-100 text-slate-900 dark:border-slate-400 dark:bg-slate-900/40 dark:text-slate-100"
                      : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
                  ].join(" ")}
                >
                  Eigene Schiffe
                </button>
              </div>

              <div className="flex min-h-0 flex-1 gap-2 lg:gap-4">
                <div
                  className={[
                    mobilePlayBoard === "fleet" ? "flex" : "hidden",
                    "relative min-h-0 min-w-0 flex-1 items-center justify-center lg:flex",
                  ].join(" ")}
                >
                  <span className="pointer-events-none absolute left-1 top-1 z-20 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-sm">
                    Deine Schiffe
                  </span>
                  <BoardGrid
                    dimmed={false}
                    renderCell={(r, c) => {
                      const sh = shipAt(game.myShips, r, c);
                      const botShot = game.mode === "single" ? game.single?.botShots[r][c] : null;
                      const wasHitByBot = botShot === "hit";
                      const wasMissedByBot = botShot === "miss";
                      const useInlineColor = wasHitByBot || wasMissedByBot;
                      const bg = sh
                        ? wasHitByBot
                          ? "border-transparent"
                          : "border-slate-600 bg-slate-500/90 dark:border-slate-400 dark:bg-slate-500/85"
                        : wasMissedByBot
                          ? "border-transparent"
                          : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800/80";
                      return (
                        <div
                          className={`relative h-full w-full rounded-md border ${bg}`}
                          style={useInlineColor ? { backgroundColor: wasHitByBot ? colors.hit : colors.miss, borderColor: wasHitByBot ? colors.hit : colors.miss } : undefined}
                        >
                          {wasHitByBot && (
                            <div className="absolute inset-0 flex items-center justify-center text-base font-black text-white">
                              ×
                            </div>
                          )}
                          <span className="sr-only">Feld {formatCell({ r, c })}</span>
                        </div>
                      );
                    }}
                  />
                </div>

                <div
                  className={[
                    mobilePlayBoard === "target" ? "flex" : "hidden",
                    "relative min-h-0 min-w-0 flex-1 items-center justify-center lg:flex",
                  ].join(" ")}
                >
                  <span className="pointer-events-none absolute left-1 top-1 z-20 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 backdrop-blur-sm">
                    {game.mode === "single" ? "Zielfeld" : "Tippfeld"}
                  </span>
                  <BoardGrid
                    dimmed={false}
                    renderCell={(r, c) => {
                      const shot =
                        game.mode === "single"
                          ? game.single?.playerShots[r][c] ?? "empty"
                          : game.trackerShotGrid[r][c];
                      const sel =
                        game.mode === "single"
                          ? game.single?.selectedTarget?.r === r &&
                            game.single?.selectedTarget?.c === c
                          : game.trackerPending?.r === r &&
                            game.trackerPending?.c === c;
                      const disabledCell =
                        game.mode === "single"
                          ? game.single?.turn !== "player" || shot !== "empty"
                          : shot === "miss";
                      return (
                        <button
                          type="button"
                          disabled={disabledCell}
                          onClick={() => {
                            if (game.mode === "single") {
                              dispatch({ type: "SINGLE_SELECT_TARGET", cell: { r, c } });
                              return;
                            }
                            dispatch({ type: "TRACKER_SELECT", cell: { r, c } });
                          }}
                          className={[
                            "group relative h-full w-full border-zinc-800/50 transition-all touch-manipulation",
                            shot === "empty" ? "hover:bg-zinc-800/50" : "",
                            sel ? "z-10 ring-2 ring-amber-500 ring-inset" : "",
                          ].join(" ")}
                        >
                          {shot === "hit" && (
                            <div className="flex h-full w-full items-center justify-center">
                              <div
                                className="h-3 w-3 animate-pulse rounded-full shadow-[0_0_8px_currentColor]"
                                style={{
                                  backgroundColor:
                                    game.mode === "single" ? "#ef4444" : colors.hit,
                                  color: game.mode === "single" ? "#ef4444" : colors.hit,
                                }}
                              />
                              <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                  backgroundColor:
                                    game.mode === "single" ? "#ef4444" : colors.hit,
                                }}
                              />
                            </div>
                          )}
                          {shot === "miss" && (
                            <div className="flex h-full w-full items-center justify-center">
                              <div
                                className="h-1.5 w-1.5 rounded-full opacity-40"
                                style={{
                                  backgroundColor:
                                    game.mode === "single" ? "#94a3b8" : colors.miss,
                                }}
                              />
                            </div>
                          )}
                          {shot === "empty" && !sel && (
                            <div className="absolute left-1/2 top-1/2 h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700 opacity-30" />
                          )}
                          <span className="sr-only">{formatCell({ r, c })}</span>
                        </button>
                      );
                    }}
                  />
                </div>
              </div>

              <div
                className="shrink-0 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/95 dark:shadow-black/30"
                style={{
                  paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
                }}
              >
                {game.mode === "single" && game.single ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 truncate rounded-lg bg-zinc-50 px-2 py-1.5 text-[11px] font-semibold text-zinc-700 sm:text-xs dark:bg-zinc-800/70 dark:text-zinc-200">
                      {game.single.turn === "player"
                        ? game.single.selectedTarget
                          ? `Ziel: ${formatCell(game.single.selectedTarget)}`
                          : "Wähle ein Feld und drücke Feuern."
                        : "Bot ist am Zug..."}
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "SINGLE_CLEAR_TARGET" })}
                      className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[11px] font-semibold text-zinc-600 transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:text-xs dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300 dark:focus-visible:ring-offset-zinc-950"
                    >
                      Aufheben
                    </button>
                    <button
                      type="button"
                      disabled={
                        game.single.turn !== "player" || !game.single.selectedTarget
                      }
                      onClick={() => dispatch({ type: "SINGLE_FIRE" })}
                      className="shrink-0 rounded-xl bg-amber-500 px-6 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm transition duration-200 hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:text-sm dark:bg-amber-400 dark:focus-visible:ring-offset-zinc-950"
                    >
                      Feuern
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={markHitMissDisabled}
                      onClick={() => dispatch({ type: "TRACKER_MARK", mark: "hit" })}
                      className="min-h-10 flex-1 rounded-xl px-4 py-2 text-xs font-black text-white transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:text-sm dark:focus-visible:ring-offset-zinc-950"
                      style={{ backgroundColor: colors.hit }}
                    >
                      Treffer
                    </button>
                    <button
                      type="button"
                      disabled={markHitMissDisabled}
                      onClick={() => dispatch({ type: "TRACKER_MARK", mark: "miss" })}
                      className="min-h-10 flex-1 rounded-xl border-2 border-zinc-400 px-4 py-2 text-xs font-black text-zinc-900 transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:text-sm dark:border-zinc-500 dark:text-zinc-100 dark:focus-visible:ring-offset-zinc-950"
                      style={{ backgroundColor: colors.miss }}
                    >
                      Kein Treffer
                    </button>
                    {showVersenktButton && (
                      <button
                        type="button"
                        title="Versenkt"
                        aria-label="Versenkt"
                        onClick={() => dispatch({ type: "TRACKER_SUNK" })}
                        className="min-h-10 rounded-xl border-2 border-amber-700 bg-amber-100 px-4 py-2 text-xs font-black text-amber-950 transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:text-sm dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-100 dark:focus-visible:ring-offset-zinc-950"
                      >
                        Versenkt
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "TRACKER_CLEAR_SELECT" })}
                      className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[11px] font-semibold text-zinc-600 transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 sm:text-xs dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300 dark:focus-visible:ring-offset-zinc-950"
                    >
                      Aufheben
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {game.phase === "finished" && (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className={`${card} w-full max-w-xl space-y-4 p-4 sm:p-6`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Spielende
                </p>
                <h2 className="font-sans text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {game.mode === "single"
                    ? game.winner === "player"
                      ? "Du hast gewonnen."
                      : "Der Bot gewinnt."
                    : "Tracking-Runde beendet."}
                </h2>
                {game.mode === "single" && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {game.winner === "player"
                      ? "Starker Abschluss. Alle Bot-Schiffe sind versenkt."
                      : "Deine Flotte wurde komplett getroffen. Neue Runde?"}
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {game.mode && (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "SET_MODE", mode: game.mode as GameMode })}
                      className="min-h-11 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-black uppercase tracking-wider text-slate-950 shadow-sm transition duration-200 hover:bg-amber-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 dark:bg-amber-400 dark:hover:bg-amber-300 dark:focus-visible:ring-offset-zinc-950"
                    >
                      Gleicher Modus
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "RESET" })}
                    className="min-h-11 rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black uppercase tracking-wider text-zinc-900 transition duration-200 hover:bg-zinc-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
                  >
                    Moduswahl
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {game.phase === "play" && game.mode === "single" && game.single?.lastBotShot && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          <div
            className={[
              "rounded-2xl border bg-white/95 px-8 py-6 shadow-md backdrop-blur-sm dark:bg-slate-900/95",
              "origin-center transform-gpu transition duration-200 ease-out",
              botShotWasHit(game.single.lastBotShot)
                ? "border-slate-300/70 dark:border-slate-600/60"
                : "border-slate-300/70 dark:border-slate-700/70",
              botOverlayEntered ? "scale-100 opacity-100" : "scale-90 opacity-0",
            ].join(" ")}
            style={
              botShotWasHit(game.single.lastBotShot)
                ? { boxShadow: `0 0 0 2px ${colors.hit}40` }
                : undefined
            }
          >
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
              Bot Zug
            </p>
            <p
              className="text-center font-sans text-4xl font-black sm:text-5xl"
              style={botShotWasHit(game.single.lastBotShot) ? { color: colors.hit } : undefined}
            >
              {overlayCellLabel(game.single.lastBotShot)}
            </p>
            <p className="mt-2 text-center text-sm font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {botShotWasHit(game.single.lastBotShot) ? "Treffer" : "Kein Treffer"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const ShipVisual = ({ len, vertical, isSelected }: { len: number; vertical: boolean; isSelected?: boolean }) => {
  const baseColor = isSelected ? "stroke-amber-400 fill-amber-500/20" : "stroke-slate-400 fill-slate-500/20";
  return (
    <svg
      viewBox={vertical ? `0 0 40 ${len * 40}` : `0 0 ${len * 40} 40`}
      className={`absolute inset-0.5 z-10 h-[calc(100%-4px)] w-[calc(100%-4px)] drop-shadow-sm ${baseColor}`}
    >
      <rect
        x="2" y="2"
        width={vertical ? "36" : len * 40 - 4}
        height={vertical ? len * 40 - 4 : "36"}
        rx="6"
        strokeWidth="2"
        className="transition-all duration-300"
      />
      {Array.from({ length: len }).map((_, i) => (
        <circle
          key={i}
          cx={vertical ? 20 : 20 + i * 40}
          cy={vertical ? 20 + i * 40 : 20}
          r="4"
          className="opacity-40"
          fill="currentColor"
        />
      ))}
    </svg>
  );
};
