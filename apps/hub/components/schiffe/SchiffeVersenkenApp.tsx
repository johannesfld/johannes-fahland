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
import { Shuffle } from "lucide-react";
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
  textColorForBg,
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
import {
  clearSchiffeState,
  loadSchiffeState,
  saveSchiffeState,
} from "@/components/schiffe/storage";
import type {
  BotShotFeedback,
  GameMode,
  PlayBoardTab,
} from "@/components/schiffe/types";
import { schiffeCard as card, schiffeGlow as glow, schiffeShell as shell } from "@/components/schiffe/styles";
import { ToolShell } from "@/components/tool-shell/ToolShell";

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
      className={`relative w-full max-h-full max-w-full rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] p-1.5 shadow-[var(--vibe-shadow-soft)] transition-opacity duration-200 sm:p-2 ${
        dimmed ? "opacity-40" : "opacity-100"
      }`}
      style={
        fitMaxWidthPx
          ? { maxWidth: `${fitMaxWidthPx}px`, touchAction: "none" }
          : { touchAction: "none" }
      }
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--vibe-r-xl)] opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--accent)_60%,transparent)_0%,transparent_75%)]" />
      </div>
      <div className={`relative ${panelClassName ?? ""}`}>
        <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-0.5 sm:grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-1">
          <div />
          <div className="grid grid-cols-10 gap-0.5 sm:gap-1">
            {Array.from({ length: GRID_SIZE }, (_, c) => (
              <div
                key={c}
                className="flex h-4 items-center justify-center rounded-[var(--vibe-r-xs)] bg-[var(--vibe-bg-base)] font-mono text-[8px] font-bold text-[var(--vibe-fg-muted)] sm:h-5 sm:text-[10px]"
              >
                {c + 1}
              </div>
            ))}
          </div>
          <div className="grid h-full grid-rows-10 gap-0.5 sm:gap-1">
            {alphabetLabels.map((letter) => (
              <div
                key={letter}
                className="flex min-h-0 items-center justify-center rounded-[var(--vibe-r-xs)] bg-[var(--vibe-bg-base)] font-mono text-[8px] font-bold text-[var(--vibe-fg-muted)] sm:text-[10px]"
              >
                {letter}
              </div>
            ))}
          </div>
          <div
            ref={innerRef}
            className="board-grid grid aspect-square flex-1 grid-cols-10 grid-rows-10 gap-[2px] rounded-[var(--vibe-r-sm)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-base)] p-[2px]"
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
              const r = Math.floor(i / GRID_SIZE);
              const c = i % GRID_SIZE;
              return (
                <div
                  key={`${r}-${c}`}
                  className="relative rounded-[2px] bg-[var(--vibe-bg-sunken)]"
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
  // SSR + erster Client-Render: deterministisch initialGame() (kein localStorage),
  // sonst Hydration-Mismatch. Gespeicherter State wird nach Mount via HYDRATE geladen.
  const [game, dispatch] = useReducer(gameReducer, undefined, initialGame);
  const isHydrated = useRef(false);
  const [colors, setColors] = useState<SchiffeColorSettings>(() =>
    loadColorSettings(),
  );
  const [hexDraft, setHexDraft] = useState<SchiffeColorSettings>(() =>
    loadColorSettings(),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobilePlayBoard, setMobilePlayBoard] = useState<PlayBoardTab>("target");
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

  // Gespeicherten Spielstand nach Mount übernehmen (einmalig).
  useEffect(() => {
    const saved = loadSchiffeState();
    if (saved) dispatch({ type: "HYDRATE", state: saved });
    isHydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isHydrated.current) return;
    if (game.phase === "modeSelect") {
      clearSchiffeState();
    } else {
      saveSchiffeState(game);
    }
  }, [game]);

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
    shipId: FleetShipId;
    pointerId?: number;
    touchId?: number;
    source: "pointer" | "touch";
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
  const touchDragMoveHandlerRef = useRef<((e: TouchEvent) => void) | null>(null);

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

  const releasePointerCapture = useCallback(() => {
    const drag = placementDrag;
    const pointerId = drag?.pointerId;
    const el = dragCaptureRef.current;
    if (el && pointerId !== undefined) {
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        // ignore already released capture
      }
    }
    dragCaptureRef.current = null;
  }, [placementDrag]);

  const finishDrag = useCallback(
    (clientX: number, clientY: number, shipId: FleetShipId) => {
      const frac = clientToPlacementFraction(clientX, clientY);
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
    },
    [clientToPlacementFraction],
  );

  const beginDrag = useCallback(
    ({
      shipId,
      clientX,
      clientY,
      pointerId,
      captureElement,
      source,
      touchId,
    }: {
      shipId: FleetShipId;
      clientX: number;
      clientY: number;
      pointerId?: number;
      captureElement?: Element | null;
      source: "pointer" | "touch";
      touchId?: number;
    }) => {
      if (source === "pointer" && pointerId !== undefined && captureElement) {
        try {
          captureElement.setPointerCapture(pointerId);
          dragCaptureRef.current = captureElement;
        } catch {
          dragCaptureRef.current = null;
        }
      } else {
        dragCaptureRef.current = null;
      }
      setPlacementDrag({
        shipId,
        pointerId,
        source,
        touchId,
      });
      lastPointerRef.current = { x: clientX, y: clientY, has: true };
      updatePlacementHover(clientX, clientY, shipId);
    },
    [updatePlacementHover],
  );

  useEffect(() => {
    if (!placementDrag || placementDrag.source !== "pointer") return;
    const { pointerId, shipId } = placementDrag;
    if (pointerId === undefined) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      lastPointerRef.current = {
        x: e.clientX,
        y: e.clientY,
        has: true,
      };
      updatePlacementHover(e.clientX, e.clientY, shipId);
    };
    const onEnd = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      releasePointerCapture();
      finishDrag(e.clientX, e.clientY, shipId);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      releasePointerCapture();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [finishDrag, placementDrag, releasePointerCapture, updatePlacementHover]);

  useEffect(() => {
    if (!placementDrag || placementDrag.source !== "touch") return;
    const { shipId, touchId } = placementDrag;
    if (touchId === undefined) return;
    const onMove = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchId);
      if (!touch) return;
      e.preventDefault();
      lastPointerRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        has: true,
      };
      updatePlacementHover(touch.clientX, touch.clientY, shipId);
    };
    const onEnd = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchId);
      if (!touch) return;
      finishDrag(touch.clientX, touch.clientY, shipId);
    };
    touchDragMoveHandlerRef.current = onMove;
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: false });
    window.addEventListener("touchcancel", onEnd, { passive: false });
    return () => {
      if (touchDragMoveHandlerRef.current) {
        window.removeEventListener("touchmove", touchDragMoveHandlerRef.current);
        touchDragMoveHandlerRef.current = null;
      }
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [finishDrag, placementDrag, updatePlacementHover]);

  useEffect(() => {
    return () => {
      if (touchDragMoveHandlerRef.current) {
        window.removeEventListener("touchmove", touchDragMoveHandlerRef.current);
      }
    };
  }, []);

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

  const botShotWasHit = (feedback: BotShotFeedback): boolean =>
    feedback.result === "hit" || feedback.result === "sunk";

  const normalizeCellLabel = (rawLabel: string): string => {
    const trimmed = rawLabel.trim();
    const letterNumber = /^([A-Za-z])(\d{1,2})$/;
    if (letterNumber.test(trimmed)) return trimmed.toUpperCase();
    const numberLetter = /^(\d{1,2})([A-Za-z])$/;
    const swapped = trimmed.match(numberLetter);
    if (!swapped) return trimmed.toUpperCase();
    return `${swapped[2].toUpperCase()}${swapped[1]}`;
  };

  const overlayCellLabel = (feedback: BotShotFeedback): string =>
    normalizeCellLabel(formatCell(feedback.cell));

  const modeSelectCard = (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className={`${card} w-full max-w-3xl space-y-4 p-4 sm:p-6`}>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vibe-fg-muted)]">
            Moduswahl
          </p>
          <h2 className="font-display text-2xl font-black tracking-tight text-[var(--vibe-fg-base)] sm:text-3xl">
            Schiffe versenken starten
          </h2>
          <p className="text-sm text-[var(--vibe-fg-muted)]">
            Wähle, ob du gegen den Bot spielst oder das manuelle 2-Spieler-Tippfeld
            nutzt.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_MODE", mode: "single" })}
            className="group rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/90 p-4 text-left shadow-[var(--vibe-shadow-soft)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--accent-line)] hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] hover:shadow-[var(--vibe-shadow-lifted)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vibe-fg-muted)]">
              1 Spieler
            </p>
            <p className="mt-1 font-display text-xl font-black text-[var(--vibe-fg-base)]">
              Gegen Bot
            </p>
            <p className="mt-2 text-xs text-[var(--vibe-fg-muted)]">
              Bot-Flotte wird zufällig gesetzt. Du feuerst pro Zug mit einem Button.
            </p>
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_MODE", mode: "twoPlayerTracker" })}
            className="group rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/90 p-4 text-left shadow-[var(--vibe-shadow-soft)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--accent-line)] hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] hover:shadow-[var(--vibe-shadow-lifted)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vibe-fg-muted)]">
              2 Spieler
            </p>
            <p className="mt-1 font-display text-xl font-black text-[var(--vibe-fg-base)]">
              Gegen Spieler
            </p>
            <p className="mt-2 text-xs text-[var(--vibe-fg-muted)]">
              Ein simpler Ersatz für das Spielfeld. Jeder Spieler öffnet diese Seite auf seinem Smartphone.
            </p>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ToolShell tool="schiffe" fullBleed className={shell}>
      <div className={glow} />
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 overflow-hidden px-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.5rem,env(safe-area-inset-top,0px))] [padding-left:max(0.5rem,env(safe-area-inset-left,0px))] [padding-right:max(0.5rem,env(safe-area-inset-right,0px))] sm:px-4 lg:px-6">
        <header className="flex shrink-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-lg font-black uppercase tracking-wider text-[var(--vibe-fg-base)] sm:text-2xl lg:text-3xl">
                Schiffe versenken
              </h1>
              {game.phase !== "modeSelect" && (
                <span className="hidden shrink-0 rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--vibe-fg-muted)] sm:inline-block">
                  {modeLabel}
                </span>
              )}
            </div>
            {game.phase !== "modeSelect" && (
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--vibe-fg-muted)] sm:hidden">
                {modeLabel}
              </p>
            )}
          </div>
          <button
            ref={settingsBtnRef}
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label="Einstellungen"
            title="Einstellungen"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-soft)] transition duration-200 hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          {game.phase !== "modeSelect" && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Spiel wirklich abbrechen und neu starten?")) {
                  setBoardSelectedId(null);
                  dispatch({ type: "RESET" });
                }
              }}
              aria-label="Spiel neu starten"
              title="Neu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--vibe-r-lg)] border border-[var(--pasch-carmine)]/40 bg-[var(--vibe-bg-elevated)] text-[var(--pasch-carmine)] shadow-[var(--vibe-shadow-soft)] transition duration-200 hover:bg-[var(--pasch-carmine-soft)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 12a9 9 0 1 0 9-9" />
                <polyline points="3 3 3 9 9 9" />
              </svg>
            </button>
          )}
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {settingsOpen && (
            <div
              ref={settingsRef}
              className="absolute inset-x-0 top-0 z-30 mx-auto max-w-3xl rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-4 shadow-[var(--vibe-shadow-lifted)]"
            >
              <p className="mb-2 text-xs font-semibold text-[var(--vibe-fg-muted)] sm:text-sm">
                Farben (Schuss-Raster)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="min-w-[5rem] text-xs font-bold text-[var(--vibe-fg-muted)]">
                    Treffer
                  </span>
                  <input
                    type="color"
                    value={colors.hit}
                    onChange={(e) => persistColors({ ...colors, hit: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded-[var(--vibe-r-md)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)]"
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
                    className="w-24 rounded-[var(--vibe-r-md)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-2 py-2 font-mono text-xs text-[var(--vibe-fg-base)]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="min-w-[5rem] text-xs font-bold text-[var(--vibe-fg-muted)]">
                    Fehlschuss
                  </span>
                  <input
                    type="color"
                    value={colors.miss}
                    onChange={(e) => persistColors({ ...colors, miss: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded-[var(--vibe-r-md)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)]"
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
                    className="w-24 rounded-[var(--vibe-r-md)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-2 py-2 font-mono text-xs text-[var(--vibe-fg-base)]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => persistColors(DEFAULT_COLORS)}
                className="mt-4 w-full rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] px-4 py-2 text-xs font-bold text-[var(--vibe-fg-muted)] transition duration-200 hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] active:scale-[0.98]"
              >
                Farben zuruecksetzen
              </button>
            </div>
          )}

          {game.phase === "modeSelect" && modeSelectCard}

          {game.phase === "place" && (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <p className="shrink-0 rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/70 px-2 py-1.5 text-center text-[10px] font-semibold leading-snug text-[var(--vibe-fg-muted)] sm:text-xs">
                <span className="hidden sm:inline">Schiff wählen, dann aufs Feld tippen zum Setzen. Ziehen geht auch. Anklicken zum Drehen.</span>
                <span className="sm:hidden">Schiff wählen · auf Feld tippen · Ziehen · Drehen</span>
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
                          setBoardSelectedId(null);
                          setPickedId(f.id);
                          beginDrag({
                            shipId: f.id,
                            clientX: e.clientX,
                            clientY: e.clientY,
                            pointerId: e.pointerId,
                            captureElement: e.currentTarget,
                            source: "pointer",
                          });
                        }}
                        onTouchStart={(e) => {
                          const touch = e.changedTouches[0];
                          if (!touch) return;
                          e.preventDefault();
                          setBoardSelectedId(null);
                          setPickedId(f.id);
                          beginDrag({
                            shipId: f.id,
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            source: "touch",
                            touchId: touch.identifier,
                          });
                        }}
                        className={[
                          "shrink-0 rounded-[var(--vibe-r-md)] border px-2 py-1.5 text-[11px] font-bold transition duration-200 select-none touch-manipulation active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 sm:px-4 sm:text-xs lg:w-full",
                          placed
                            ? "cursor-grab border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] text-[var(--vibe-fg-muted)] active:cursor-grabbing"
                            : pickedId === f.id
                              ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent-ink)]"
                              : "border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-base)] hover:border-[var(--accent-line)]",
                        ].join(" ")}
                      >
                        {f.len}er
                      </button>
                    );
                  })}
                </div>
                <div className="order-1 flex min-h-0 flex-1 items-center justify-center lg:order-2">
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
                            className="flex items-center justify-center rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/90 text-lg leading-none text-[var(--vibe-fg-base)] shadow-[var(--vibe-shadow-lifted)] backdrop-blur-sm transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
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
                            className="flex items-center justify-center rounded-[var(--vibe-r-lg)] border border-[var(--pasch-carmine)]/40 bg-[var(--vibe-bg-elevated)]/90 text-base font-black leading-none text-[var(--pasch-carmine)] shadow-[var(--vibe-shadow-lifted)] backdrop-blur-sm transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
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
                      const isDraggedShip = Boolean(placementDrag && sh && sh.id === placementDrag.shipId);
                      const isHoverAnchor = prev && placementHover?.cells[0]?.r === r && placementHover?.cells[0]?.c === c;
                      return (
                        <button
                          type="button"
                          ref={(el) => {
                            placementCellRefs.current[r][c] = el;
                          }}
                          className={[
                            "group relative h-full w-full touch-manipulation transition-colors text-[0px]",
                            !sh && !prev ? "hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]" : "",
                          ].join(" ")}
                          onPointerDown={(e) => {
                            if (!sh) return;
                            e.preventDefault();
                            setBoardSelectedId(sh.id);
                            setPickedId(sh.id);
                            setVertical(placedShipIsVertical(sh));
                            beginDrag({
                              shipId: sh.id,
                              clientX: e.clientX,
                              clientY: e.clientY,
                              pointerId: e.pointerId,
                              captureElement: e.currentTarget,
                              source: "pointer",
                            });
                          }}
                          onTouchStart={(e) => {
                            if (!sh) return;
                            const touch = e.changedTouches[0];
                            if (!touch) return;
                            e.preventDefault();
                            setBoardSelectedId(sh.id);
                            setPickedId(sh.id);
                            setVertical(placedShipIsVertical(sh));
                            beginDrag({
                              shipId: sh.id,
                              clientX: touch.clientX,
                              clientY: touch.clientY,
                              source: "touch",
                              touchId: touch.identifier,
                            });
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
                          {sh && sh.cells[0].r === r && sh.cells[0].c === c && !isDraggedShip && (
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
                          {prev && isHoverAnchor && placementDrag && (
                            <div
                              className="pointer-events-none absolute left-0 top-0 z-20"
                              style={{
                                width: vertical
                                  ? "100%"
                                  : `calc(${placementHover!.cells.length * 100}% + ${(placementHover!.cells.length - 1) * boardCellGapPx}px)`,
                                height: vertical
                                  ? `calc(${placementHover!.cells.length * 100}% + ${(placementHover!.cells.length - 1) * boardCellGapPx}px)`
                                  : "100%",
                                opacity: prevOk ? 0.7 : 0.35,
                              }}
                            >
                              <ShipVisual
                                len={placementHover!.cells.length}
                                vertical={vertical}
                                isSelected
                              />
                            </div>
                          )}
                          {prev && !isHoverAnchor && placementDrag && !prevOk && (
                            <div className="absolute inset-0 z-10 rounded-sm bg-[var(--pasch-carmine)] opacity-40" />
                          )}
                          {prev && !placementDrag && (
                            <div
                              className={`absolute inset-0 z-10 rounded-sm opacity-40 ${
                                prevOk ? "bg-[var(--pasch-success)]" : "bg-[var(--pasch-carmine)]"
                              }`}
                            />
                          )}
                          {!sh && !prev && (
                            <div className="absolute left-1/2 top-1/2 h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--vibe-fg-muted)] opacity-60" />
                          )}
                          <span className="sr-only">Feld {formatCell({ r, c })}</span>
                        </button>
                      );
                    }}
                  />
                </div>
              </div>
              {/* Aktionsleiste: auf mobile sitzt darunter die fixe BottomNav (64px),
                  daher Abstand, damit die Buttons nicht verdeckt werden. desk: Nav weg. */}
              <div className="flex shrink-0 gap-2 pb-[calc(64px+env(safe-area-inset-bottom,0px))] desk:pb-0">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "PLACE_ALL_RANDOM" })}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--vibe-r-xl)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-xs font-black uppercase tracking-wider text-[var(--accent-ink)] transition duration-200 hover:brightness-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 sm:py-2.5 sm:text-sm"
                >
                  <Shuffle className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  <span>Zufällig</span>
                </button>
                <button
                  type="button"
                  disabled={!fleetIsCompleteAndValid(game.myShips)}
                  onClick={() => dispatch({ type: "ADVANCE_PLACEMENT" })}
                  className="flex-1 rounded-[var(--vibe-r-xl)] bg-[var(--accent)] py-2 text-xs font-black uppercase tracking-wider text-[var(--accent-ink)] shadow-[var(--vibe-shadow-soft)] transition duration-200 hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 sm:py-2.5 sm:text-sm"
                >
                  {game.mode === "single" ? "Spiel starten" : "Weiter zum Tippfeld"}
                </button>
              </div>
            </div>
          )}

          {game.phase === "play" && (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              {/* Segmented control: Zielfeld / Eigene Schiffe (nur mobile) */}
              <div className="shrink-0 lg:hidden">
                <div
                  role="tablist"
                  aria-label="Spielfeld wechseln"
                  className="relative grid grid-cols-2 gap-1 rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobilePlayBoard === "target"}
                    onClick={() => setMobilePlayBoard("target")}
                    className={[
                      "relative z-10 min-h-9 rounded-[var(--vibe-r-md)] px-2 text-[12px] font-bold transition-all duration-200 active:scale-[0.98]",
                      mobilePlayBoard === "target"
                        ? "bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-base)] shadow-[var(--vibe-shadow-soft)]"
                        : "text-[var(--vibe-fg-muted)]",
                    ].join(" ")}
                  >
                    {game.mode === "single" ? "Zielfeld" : "Tippfeld"}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobilePlayBoard === "fleet"}
                    onClick={() => setMobilePlayBoard("fleet")}
                    className={[
                      "relative z-10 min-h-9 rounded-[var(--vibe-r-md)] px-2 text-[12px] font-bold transition-all duration-200 active:scale-[0.98]",
                      mobilePlayBoard === "fleet"
                        ? "bg-[var(--vibe-bg-elevated)] text-[var(--vibe-fg-base)] shadow-[var(--vibe-shadow-soft)]"
                        : "text-[var(--vibe-fg-muted)]",
                    ].join(" ")}
                  >
                    Eigene Schiffe
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 gap-2 lg:gap-4">
                <div
                  className={[
                    mobilePlayBoard === "fleet" ? "flex" : "hidden",
                    "relative min-h-0 min-w-0 flex-1 items-center justify-center lg:flex",
                  ].join(" ")}
                >
                  <span className="pointer-events-none absolute left-1 top-1 z-20 rounded-[var(--vibe-r-sm)] bg-[var(--vibe-bg-sunken)]/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vibe-fg-muted)] backdrop-blur-sm">
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
                          : "border-[var(--vibe-line-brass)] bg-[color-mix(in_srgb,var(--accent)_55%,var(--vibe-bg-elevated))]"
                        : wasMissedByBot
                          ? "border-transparent"
                          : "border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/80";
                      return (
                        <div
                          className={`relative h-full w-full rounded-[var(--vibe-r-sm)] border ${bg}`}
                          style={useInlineColor ? { backgroundColor: wasHitByBot ? colors.hit : colors.miss, borderColor: wasHitByBot ? colors.hit : colors.miss } : undefined}
                        >
                          {wasHitByBot && (
                            <div className="absolute inset-0 flex items-center justify-center text-base font-black text-[var(--vibe-bg-elevated)]">
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
                  <span className="pointer-events-none absolute left-1 top-1 z-20 rounded-[var(--vibe-r-sm)] bg-[var(--vibe-bg-sunken)]/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vibe-fg-muted)] backdrop-blur-sm">
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
                          : false;
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
                            "group relative h-full w-full border-[var(--vibe-line)]/50 transition-all touch-manipulation",
                            shot === "empty" ? "hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]" : "",
                            sel ? "z-10 ring-2 ring-[var(--accent)] ring-inset" : "",
                          ].join(" ")}
                        >
                          {shot === "hit" && (
                            <div className="flex h-full w-full items-center justify-center">
                              <div
                                className="h-3 w-3 animate-pulse rounded-full shadow-[0_0_8px_currentColor]"
                                style={{
                                  backgroundColor: colors.hit,
                                  color: colors.hit,
                                }}
                              />
                              <div
                                className="absolute inset-0 opacity-20"
                                style={{ backgroundColor: colors.hit }}
                              />
                            </div>
                          )}
                          {shot === "miss" && (
                            <div className="flex h-full w-full items-center justify-center">
                              <div
                                className="h-1.5 w-1.5 rounded-full opacity-40"
                                style={{ backgroundColor: colors.miss }}
                              />
                            </div>
                          )}
                          {shot === "empty" && !sel && (
                            <div className="absolute left-1/2 top-1/2 h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--vibe-fg-muted)] opacity-30" />
                          )}
                          <span className="sr-only">{formatCell({ r, c })}</span>
                        </button>
                      );
                    }}
                  />
                </div>
              </div>

              <div
                className="shrink-0 rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/95 p-2 shadow-[var(--vibe-shadow-soft)] mb-[calc(64px+env(safe-area-inset-bottom,0px))] desk:mb-0"
              >
                {game.mode === "single" && game.single ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 truncate rounded-[var(--vibe-r-md)] bg-[var(--vibe-bg-sunken)] px-2 py-1.5 text-[11px] font-semibold text-[var(--vibe-fg-muted)] sm:text-xs">
                      {game.single.turn === "player"
                        ? game.single.selectedTarget
                          ? `Ziel: ${formatCell(game.single.selectedTarget)}`
                          : "Wähle ein Feld und drücke Feuern."
                        : "Bot ist am Zug..."}
                    </span>
                    <button
                      type="button"
                      disabled={
                        game.single.turn !== "player" || !game.single.selectedTarget
                      }
                      onClick={() => dispatch({ type: "SINGLE_FIRE" })}
                      className="shrink-0 rounded-[var(--vibe-r-lg)] bg-[var(--accent)] px-6 py-2 text-xs font-black uppercase tracking-wider text-[var(--accent-ink)] shadow-[var(--vibe-shadow-soft)] transition duration-200 hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 sm:text-sm"
                    >
                      Feuern
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const pendingShot = game.trackerPending
                        ? game.trackerShotGrid[game.trackerPending.r][game.trackerPending.c]
                        : null;
                      const isHit = pendingShot === "hit";
                      const isMiss = pendingShot === "miss";
                      const isEmpty = pendingShot === "empty";
                      return (
                        <>
                          {isEmpty && (
                            <>
                              <button
                                type="button"
                                disabled={markHitMissDisabled}
                                onClick={() => dispatch({ type: "TRACKER_MARK", mark: "hit" })}
                                className="min-h-10 flex-1 rounded-[var(--vibe-r-lg)] px-4 py-2 text-xs font-black transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 sm:text-sm"
                                style={{ backgroundColor: colors.hit, color: textColorForBg(colors.hit) }}
                              >
                                Treffer
                              </button>
                              <button
                                type="button"
                                disabled={markHitMissDisabled}
                                onClick={() => dispatch({ type: "TRACKER_MARK", mark: "miss" })}
                                className="min-h-10 flex-1 rounded-[var(--vibe-r-lg)] border-2 px-4 py-2 text-xs font-black transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 sm:text-sm"
                                style={{ backgroundColor: colors.miss, color: textColorForBg(colors.miss), borderColor: colors.miss }}
                              >
                                Kein Treffer
                              </button>
                            </>
                          )}
                          {isHit && (
                            <>
                              {showVersenktButton && (
                                <button
                                  type="button"
                                  title="Versenkt"
                                  aria-label="Versenkt"
                                  onClick={() => dispatch({ type: "TRACKER_SUNK" })}
                                  className="min-h-10 rounded-[var(--vibe-r-lg)] border-2 border-[var(--accent-line)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-4 py-2 text-xs font-black text-[var(--accent-ink)] transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 sm:text-sm"
                                >
                                  Versenkt
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => dispatch({ type: "TRACKER_UNDO" })}
                                className="min-h-10 flex-1 rounded-[var(--vibe-r-lg)] border-2 border-[var(--pasch-carmine)]/40 bg-[var(--pasch-carmine-soft)] px-4 py-2 text-xs font-black text-[var(--pasch-carmine-text)] transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 sm:text-sm"
                              >
                                Aufheben
                              </button>
                            </>
                          )}
                          {isMiss && (
                            <button
                              type="button"
                              onClick={() => dispatch({ type: "TRACKER_UNDO" })}
                              className="min-h-10 flex-1 rounded-[var(--vibe-r-lg)] border-2 border-[var(--pasch-carmine)]/40 bg-[var(--pasch-carmine-soft)] px-4 py-2 text-xs font-black text-[var(--pasch-carmine-text)] transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 sm:text-sm"
                            >
                              Aufheben
                            </button>
                          )}
                          {!game.trackerPending && (
                            <span className="flex-1 truncate rounded-[var(--vibe-r-md)] bg-[var(--vibe-bg-sunken)] px-2 py-1.5 text-center text-[11px] font-semibold text-[var(--vibe-fg-muted)] sm:text-xs">
                              Feld antippen zum Markieren
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {game.phase === "finished" && (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className={`${card} w-full max-w-xl space-y-4 p-4 sm:p-6`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vibe-fg-muted)]">
                  Spielende
                </p>
                <h2 className="font-display text-3xl font-black tracking-tight text-[var(--vibe-fg-base)]">
                  {game.mode === "single"
                    ? game.winner === "player"
                      ? "Du hast gewonnen."
                      : "Der Bot gewinnt."
                    : "Tracking-Runde beendet."}
                </h2>
                {game.mode === "single" && (
                  <p className="text-sm text-[var(--vibe-fg-muted)]">
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
                      className="min-h-11 rounded-[var(--vibe-r-xl)] bg-[var(--accent)] px-4 py-2 text-sm font-black uppercase tracking-wider text-[var(--accent-ink)] shadow-[var(--vibe-shadow-soft)] transition duration-200 hover:brightness-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
                    >
                      Gleicher Modus
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "RESET" })}
                    className="min-h-11 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-4 py-2 text-sm font-black uppercase tracking-wider text-[var(--vibe-fg-base)] transition duration-200 hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2"
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
              "rounded-[var(--vibe-r-xl)] border bg-[var(--vibe-bg-elevated)]/95 px-8 py-6 shadow-[var(--vibe-shadow-lifted)] backdrop-blur-sm",
              "origin-center transform-gpu transition duration-200 ease-out",
              "border-[var(--vibe-line)]",
              botOverlayEntered ? "scale-100 opacity-100" : "scale-90 opacity-0",
            ].join(" ")}
            style={
              botShotWasHit(game.single.lastBotShot)
                ? { boxShadow: `0 0 0 2px ${colors.hit}40` }
                : undefined
            }
          >
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vibe-fg-muted)]">
              Bot Zug
            </p>
            <p
              className="text-center font-display text-4xl font-black sm:text-5xl"
              style={botShotWasHit(game.single.lastBotShot) ? { color: colors.hit } : undefined}
            >
              {overlayCellLabel(game.single.lastBotShot)}
            </p>
            <p className="mt-2 text-center text-sm font-black uppercase tracking-wider text-[var(--vibe-fg-muted)]">
              {botShotWasHit(game.single.lastBotShot) ? "Treffer" : "Kein Treffer"}
            </p>
          </div>
        </div>
      )}
    </ToolShell>
  );
}

const ShipVisual = ({ len, vertical, isSelected }: { len: number; vertical: boolean; isSelected?: boolean }) => {
  const baseColor = isSelected ? "stroke-[var(--accent)] fill-[var(--accent)]/20" : "stroke-[var(--vibe-fg-muted)] fill-[var(--vibe-fg-muted)]/20";
  return (
    <svg
      viewBox={vertical ? `0 0 40 ${len * 40}` : `0 0 ${len * 40} 40`}
      className={`absolute inset-0 z-10 h-full w-full drop-shadow-sm ${baseColor}`}
      preserveAspectRatio="none"
    >
      <rect
        x="1" y="1"
        width={vertical ? "38" : len * 40 - 2}
        height={vertical ? len * 40 - 2 : "38"}
        rx="5"
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
