"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share, Plus, X, Download } from "lucide-react";
import { Brandmark } from "@/components/ui/Brandmark";
import { detectPlatform, isStandalone, type Platform } from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "turnier-install-dismissed";
const VISIT_KEY = "turnier-visit-count";
// Nach Dismiss erst nach 14 Tagen erneut zeigen (nicht für immer tot).
const REDISPLAY_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

type InstallPromptProps = {
  /** Name der App im Banner-Text. */
  appName: string;
  className?: string;
};

/** Dismiss merkt sich Zeitstempel; erst nach REDISPLAY_AFTER_MS wieder zeigbar. */
function recentlyDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  if (raw === "installed") return true;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < REDISPLAY_AFTER_MS;
}

/** Erst nach echtem Engagement (≥2. Besuch) zeigen. */
function bumpVisitAndCheckEngaged(): boolean {
  if (typeof window === "undefined") return false;
  const n = Number(localStorage.getItem(VISIT_KEY) || "0") + 1;
  localStorage.setItem(VISIT_KEY, String(n));
  return n >= 2;
}

export function InstallPrompt({ appName, className }: InstallPromptProps) {
  // Lazy-Init im Browser; UI erscheint ohnehin erst nach dem Effect (visible),
  // daher kein Hydration-Mismatch trotz UA-abhängigem Wert.
  const [platform] = useState<Platform>(() =>
    typeof window === "undefined" ? "desktop" : detectPlatform(),
  );
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const plat = platform;
    const engaged = bumpVisitAndCheckEngaged();

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
      if (engaged) setVisible(true);
    };
    const onAppInstalled = () => {
      localStorage.setItem(DISMISS_KEY, "installed");
      setVisible(false);
      setDeferredEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // iOS feuert KEIN beforeinstallprompt → bei Engagement direkt die Anleitung zeigen.
    if (plat === "ios" && engaged) {
      const t = window.setTimeout(() => setVisible(true), 1200);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.removeEventListener("appinstalled", onAppInstalled);
      };
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [platform]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    if (outcome === "accepted") localStorage.setItem(DISMISS_KEY, "installed");
    else localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferredEvent(null);
    setVisible(false);
  };

  // iOS = Anleitung (kein Event nötig); sonst nur, wenn echter Install verfügbar ist.
  const canShow = visible && (platform === "ios" || deferredEvent != null);

  return (
    <AnimatePresence>
      {canShow ? (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          role="dialog"
          aria-label={`${appName} installieren`}
          className={[
            "fixed inset-x-0 z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-sm items-start gap-3 rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-overlay)] p-3.5 shadow-[var(--vibe-shadow-lifted)]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--vibe-r-md)] bg-[var(--accent-soft)] text-[var(--accent)]">
            <Brandmark size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-extrabold text-[var(--vibe-fg-base)]">
              {appName} als App
            </p>
            {platform === "ios" ? (
              <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-[var(--vibe-fg-muted)]">
                Tippe auf
                <Share className="inline h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={2.4} />
                <span className="font-semibold text-[var(--vibe-fg-base)]">Teilen</span>
                <span>und dann</span>
                <Plus className="inline h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={2.6} />
                <span className="font-semibold text-[var(--vibe-fg-base)]">
                  „Zum Home-Bildschirm“.
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-[var(--vibe-fg-muted)]">
                Schneller Zugriff &amp; Vollbild – direkt vom Startbildschirm.
              </p>
            )}
            {platform !== "ios" ? (
              <button
                type="button"
                onClick={handleInstall}
                className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-[var(--vibe-r-lg)] bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-ink)] shadow-[var(--vibe-shadow-soft)] transition-transform active:scale-[0.96]"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
                Installieren
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Schließen"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--vibe-fg-faint)] transition-colors [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)] [@media(hover:hover)]:hover:text-[var(--vibe-fg-base)]"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
