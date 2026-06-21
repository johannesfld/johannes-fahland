"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pasch-install-dismissed";

type InstallPromptProps = {
  /** Name der App im Banner-Text, z.B. "Pasch" oder "Pasch Turnierleitung". */
  appName: string;
  className?: string;
};

export function InstallPrompt({ appName, className }: InstallPromptProps) {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    setDismissed(false);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredEvent(null);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (dismissed || !deferredEvent) return null;

  const handleInstall = async () => {
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferredEvent(null);
    setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const classes = [
    // bottom-Offset via Inline-Style statt arbitrary-Klasse: Tailwind v4 kompiliert
    // `bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]` nicht zuverlässig, der
    // Banner landete dadurch am oberen Rand. Inline ist robust.
    "fixed inset-x-0 z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-sm items-center gap-3 rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-3 shadow-[var(--vibe-shadow-lifted)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="dialog"
      aria-label="App installieren"
      className={classes}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-[var(--vibe-fg-base)]">
          {appName} installieren
        </p>
        <p className="text-xs text-[var(--vibe-fg-muted)]">
          Als App hinzufügen für schnellen Zugriff und Offline-Nutzung.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-[var(--vibe-r-sm)] px-2 py-1.5 text-xs font-medium text-[var(--vibe-fg-muted)] transition-colors hover:text-[var(--vibe-fg-base)]"
      >
        Später
      </button>
      <button
        type="button"
        onClick={handleInstall}
        className="shrink-0 rounded-[var(--vibe-r-md)] bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-50)] shadow-[var(--vibe-shadow-soft)] transition-all hover:brightness-110 active:scale-[0.98]"
      >
        Installieren
      </button>
    </div>
  );
}
