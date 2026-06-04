"use client";

import { LogOut } from "lucide-react";
import { useFullscreen } from "@/components/FullscreenContext";
import { IconAlert } from "@/components/ui/icons";

export function BigNumber({ value }: { value: number }) {
  return (
    <div
      className={
        "flex min-h-[5rem] min-w-[6rem] items-center justify-center rounded-2xl border-4 border-[var(--accent)] " +
        "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-5xl font-serif font-bold tabular-nums text-[var(--accent)] " +
        "md:min-h-[5.5rem] md:min-w-[8rem] md:text-6xl"
      }
      aria-live="polite"
      aria-label={`Wert ${value}`}
    >
      {value}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className={
        "flex items-start justify-center gap-2 rounded-2xl border border-red-300/80 bg-red-50/95 p-3 text-center " +
        "text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-100"
      }
      role="alert"
    >
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
      <span>{message}</span>
    </div>
  );
}

export function CloseGameButton({ onClick }: { onClick: () => void }) {
  const { fullscreen } = useFullscreen();
  // Auf desktop im fullscreen: links oben (rechts ist X-Button).
  // Sonst: rechts oben.
  const position = fullscreen
    ? "absolute left-3 top-3 z-10 md:left-4 md:top-4"
    : "absolute right-3 top-3 z-10 md:right-4 md:top-4";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        `${position} inline-flex h-10 w-10 items-center justify-center rounded-xl border ` +
        "border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/90 text-[var(--vibe-fg-muted)] transition-colors hover:border-red-400/50 hover:text-red-500"
      }
      aria-label="Spiel beenden"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}
