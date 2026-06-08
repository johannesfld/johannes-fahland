"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "app-chrome-fullscreen";

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

type FullscreenContextValue = {
  fullscreen: boolean;
  setFullscreen: (value: boolean) => void;
  toggleFullscreen: () => void;
};

const FullscreenContext = createContext<FullscreenContextValue | null>(null);

export function FullscreenProvider({ children }: { children: React.ReactNode }) {
  const [fullscreen, setFullscreenState] = useState(false);

  useEffect(() => {
    setFullscreenState(readStored());
  }, []);

  const setFullscreen = useCallback((value: boolean) => {
    setFullscreenState(value);
    try {
      if (value) {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setFullscreenState((prev) => {
      const next = !prev;
      try {
        if (next) {
          window.localStorage.setItem(STORAGE_KEY, "1");
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ fullscreen, setFullscreen, toggleFullscreen }),
    [fullscreen, setFullscreen, toggleFullscreen],
  );

  return <FullscreenContext.Provider value={value}>{children}</FullscreenContext.Provider>;
}

export function useFullscreen(): FullscreenContextValue {
  const ctx = useContext(FullscreenContext);
  if (!ctx) {
    throw new Error("useFullscreen must be used within FullscreenProvider");
  }
  return ctx;
}
