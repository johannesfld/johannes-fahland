"use client";

import { useEffect, useState } from "react";
import { useTheme, type ThemeSetting } from "@/components/ThemeProvider";
import { IconMonitor, IconMoon, IconSun } from "@/components/ui/icons";

const ORDER: ThemeSetting[] = ["light", "dark", "system"];

const labels: Record<ThemeSetting, string> = {
  light: "Helles Design",
  dark: "Dunkles Design",
  system: "Wie System",
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolved } = useTheme();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const cycle = () => {
    const i = ORDER.indexOf(theme);
    const next = ORDER[(i + 1) % ORDER.length];
    setTheme(next);
  };

  const Icon =
    theme === "light"
      ? IconSun
      : theme === "dark"
        ? IconMoon
        : IconMonitor;

  const activeHint =
    resolved === "dark" ? "aktiv: dunkel" : "aktiv: hell";
  const title = hydrated
    ? `${labels[theme]} (${activeHint})`
    : labels[theme];

  return (
    <button
      type="button"
      onClick={cycle}
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200",
        "border-zinc-200/90 bg-white/90 text-zinc-700 shadow-sm hover:border-amber-300/60 hover:bg-amber-50/80 hover:text-zinc-900",
        "dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-amber-500/30 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-50",
        "motion-safe:active:scale-[0.98]",
        className,
      ].join(" ")}
      title={title}
      aria-label={
        hydrated
          ? `Design: ${labels[theme]} (${activeHint}). Klicken zum Wechseln.`
          : `Design: ${labels[theme]}. Klicken zum Wechseln.`
      }
    >
      <Icon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="hidden min-[380px]:inline">{labels[theme]}</span>
    </button>
  );
}
