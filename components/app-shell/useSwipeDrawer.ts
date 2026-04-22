import { useEffect, useRef } from "react";

const EDGE_ZONE = 24;
const SNAP_THRESHOLD = 0.4;

type SwipeDrawerOptions = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  drawerRef: React.RefObject<HTMLDivElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
};

export function useSwipeDrawer({
  isOpen,
  onOpen,
  onClose,
  drawerRef,
  overlayRef,
}: SwipeDrawerOptions) {
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const pendingCleanup = useRef(false);

  useEffect(() => {
    if (!pendingCleanup.current) return;
    pendingCleanup.current = false;
    requestAnimationFrame(() => {
      drawerRef.current?.style.removeProperty("transform");
      const o = overlayRef.current;
      if (o) {
        o.style.removeProperty("opacity");
        o.style.removeProperty("pointer-events");
      }
    });
  }, [isOpen, drawerRef, overlayRef]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let dragging = false;
    let edgeSwipe = false;
    let locked = false;
    let openAtStart = false;
    let insideDrawer = false;
    let dw = 0;

    const DRAG_THRESHOLD = 10;

    function getWidth() {
      if (drawerRef.current) return drawerRef.current.offsetWidth;
      return Math.min(320, window.innerWidth * 0.88);
    }

    function setDragMode(on: boolean) {
      const d = drawerRef.current;
      const o = overlayRef.current;
      if (!d || !o) return;
      if (on) {
        d.style.transition = "none";
        d.style.willChange = "transform";
        o.style.transition = "none";
        o.style.willChange = "opacity";
      } else {
        d.style.removeProperty("transition");
        d.style.removeProperty("will-change");
        o.style.removeProperty("transition");
        o.style.removeProperty("will-change");
      }
    }

    function onStart(e: TouchEvent) {
      if (!mq.matches) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      openAtStart = isOpenRef.current;
      dw = getWidth();
      locked = false;
      dragging = false;
      insideDrawer = Boolean(
        drawerRef.current?.contains(e.target as Node),
      );

      if (!openAtStart && t.clientX < EDGE_ZONE) {
        edgeSwipe = true;
        tracking = true;
      } else if (openAtStart && !insideDrawer) {
        edgeSwipe = false;
        tracking = true;
      } else {
        tracking = false;
      }
    }

    function promoteToDrag() {
      if (dragging) return;
      dragging = true;
      setDragMode(true);
    }

    function onMove(e: TouchEvent) {
      if (!tracking) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (!dragging) {
        if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dy) > DRAG_THRESHOLD) {
          tracking = false;
          return;
        }
        if (Math.abs(dx) >= DRAG_THRESHOLD) {
          promoteToDrag();
          locked = true;
        } else {
          return;
        }
      }

      if (!locked) {
        if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dy) > DRAG_THRESHOLD) {
          dragging = false;
          tracking = false;
          setDragMode(false);
          return;
        }
        if (Math.abs(dx) > DRAG_THRESHOLD) locked = true;
      }

      const d = drawerRef.current;
      const o = overlayRef.current;
      if (!d || !o) return;

      if (!openAtStart && edgeSwipe) {
        const tx = Math.max(-dw, Math.min(0, -dw + dx));
        const p = 1 - Math.abs(tx) / dw;
        d.style.transform = `translateX(${tx}px)`;
        o.style.opacity = String(p);
        o.style.pointerEvents = p > 0.05 ? "auto" : "none";
      } else if (openAtStart) {
        const tx = Math.min(0, Math.max(-dw, dx));
        const p = 1 - Math.abs(tx) / dw;
        d.style.transform = `translateX(${tx}px)`;
        o.style.opacity = String(p);
      }
    }

    function onEnd() {
      if (!dragging) {
        tracking = false;
        return;
      }
      dragging = false;
      tracking = false;
      setDragMode(false);

      const d = drawerRef.current;
      if (!d) return;

      const m = d.style.transform.match(/translateX\((-?[\d.]+)px\)/);
      if (!m) {
        d.style.removeProperty("transform");
        const o = overlayRef.current;
        if (o) {
          o.style.removeProperty("opacity");
          o.style.removeProperty("pointer-events");
        }
        return;
      }

      const curX = parseFloat(m[1]);
      const progress = 1 - Math.abs(curX) / dw;

      if (!openAtStart) {
        if (progress > SNAP_THRESHOLD) {
          pendingCleanup.current = true;
          onOpenRef.current();
        } else {
          d.style.removeProperty("transform");
          const o = overlayRef.current;
          if (o) {
            o.style.removeProperty("opacity");
            o.style.removeProperty("pointer-events");
          }
        }
      } else {
        if (progress < 1 - SNAP_THRESHOLD) {
          pendingCleanup.current = true;
          onCloseRef.current();
        } else {
          d.style.removeProperty("transform");
          overlayRef.current?.style.removeProperty("opacity");
        }
      }

      edgeSwipe = false;
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [drawerRef, overlayRef]);
}
