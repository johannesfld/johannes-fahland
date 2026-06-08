"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeSetting = "light" | "dark" | "system";

type Ctx = {
  theme: ThemeSetting;
  setTheme: (t: ThemeSetting) => void;
  resolved: "light" | "dark";
};

const ThemeContext = createContext<Ctx | null>(null);

function readResolved(setting: ThemeSetting): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  if (setting === "light") return "light";
  if (setting === "dark") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyDom(r: "light" | "dark") {
  document.documentElement.classList.toggle("dark", r === "dark");
  document.documentElement.style.colorScheme = r;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>("system");
  const [mounted, setMounted] = useState(false);
  const [systemEpoch, setSystemEpoch] = useState(0);

  /** Until mounted, match SSR: `readResolved("system")` uses `light` without `window` (see readResolved). */
  const resolved: "light" | "dark" = mounted
    ? readResolved(theme)
    : theme === "dark"
      ? "dark"
      : "light";

  useEffect(() => {
    queueMicrotask(() => {
      const stored = localStorage.getItem("theme") as ThemeSetting | null;
      const init: ThemeSetting =
        stored === "light" || stored === "dark" || stored === "system"
          ? stored
          : "system";
      setThemeState(init);
      applyDom(readResolved(init));
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyDom(readResolved(theme));
    localStorage.setItem("theme", theme);
  }, [theme, mounted, systemEpoch]);

  useEffect(() => {
    if (!mounted || theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setSystemEpoch((e) => e + 1);
      applyDom(readResolved("system"));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, mounted]);

  const setTheme = useCallback((t: ThemeSetting) => setThemeState(t), []);

  const value = useMemo(
    () => ({ theme, setTheme, resolved }),
    [theme, setTheme, resolved],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
