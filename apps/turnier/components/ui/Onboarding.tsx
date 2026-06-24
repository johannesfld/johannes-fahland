"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Trophy,
  Users,
  Shuffle,
  ListChecks,
  Medal,
  Share,
  Plus,
  Download,
  X,
} from "lucide-react";
import { Brandmark } from "@/components/ui/Brandmark";
import { actionBtn, ghostBtn, subtleBtn } from "@/components/turnier/styles";
import { cn } from "@/components/ui/styles";
import { detectPlatform, isStandalone, type Platform } from "@/lib/pwa";

const ONBOARDED_KEY = "turnier-onboarded";
/** Custom-Event, mit dem die Slide „als App" jederzeit erneut geöffnet wird. */
export const OPEN_INSTALL_GUIDE_EVENT = "turnier:open-install-guide";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function Onboarding() {
  const reduce = useReducedMotion();
  // Initial false (kein Hydration-Mismatch); Gate wird nach Mount gesetzt.
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  // Lazy-Init im Browser; Overlay erscheint erst nach dem Effect (open).
  const [platform] = useState<Platform>(() =>
    typeof window === "undefined" ? "desktop" : detectPlatform(),
  );
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Erstbesuch-Gate: nicht im Standalone, nur wenn noch nicht abgeschlossen.
    // Externe Synchronisation (localStorage) → Regel hier bewusst deaktiviert.
    if (!isStandalone() && localStorage.getItem(ONBOARDED_KEY) !== "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }

    // Später erneut öffnen (Hilfe-Eintrag) → direkt zur Install-Slide.
    const onOpenGuide = () => {
      setSlide(2);
      setOpen(true);
    };
    window.addEventListener(OPEN_INSTALL_GUIDE_EVENT, onOpenGuide);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener(OPEN_INSTALL_GUIDE_EVENT, onOpenGuide);
    };
  }, []);

  const finish = () => {
    localStorage.setItem(ONBOARDED_KEY, "1");
    setOpen(false);
  };

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    finish();
  };

  const slides = [
    {
      key: "intro",
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[var(--vibe-r-2xl)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--vibe-shadow-clay)]">
            <Brandmark size={44} />
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--vibe-fg-base)]">
            Willkommen bei Turnier
          </h2>
          <p className="max-w-xs text-sm text-[var(--vibe-fg-muted)]">
            Lege Turniere an, lose Runden aus und behalte Ergebnisse &amp; Tabelle im Blick – für
            Tischtennis &amp; mehr.
          </p>
        </div>
      ),
    },
    {
      key: "how",
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--vibe-fg-base)]">
            So funktioniert&apos;s
          </h2>
          <div className="grid w-full max-w-xs grid-cols-1 gap-2">
            {[
              { icon: Users, label: "Spieler eintragen" },
              { icon: Shuffle, label: "Runden auslosen" },
              { icon: ListChecks, label: "Ergebnisse erfassen" },
              { icon: Trophy, label: "Tabelle verfolgen" },
              { icon: Medal, label: "Sieger ehren" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-3 py-2.5 text-left shadow-[var(--vibe-shadow-soft)]"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <span className="text-sm font-semibold text-[var(--vibe-fg-base)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "install",
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[var(--vibe-r-2xl)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--vibe-shadow-clay)]">
            <Download className="h-8 w-8" strokeWidth={2.2} />
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--vibe-fg-base)]">
            Turnier als App
          </h2>
          {platform === "ios" ? (
            <div className="flex max-w-xs flex-col gap-2 text-sm text-[var(--vibe-fg-muted)]">
              <p>Füge Turnier zum Home-Bildschirm hinzu – für Vollbild &amp; schnellen Zugriff:</p>
              <div className="flex items-center justify-center gap-2 rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-3 py-2.5 shadow-[var(--vibe-shadow-soft)]">
                <Share className="h-5 w-5 text-[var(--accent)]" strokeWidth={2.2} />
                <span className="font-semibold text-[var(--vibe-fg-base)]">Teilen</span>
                <span className="text-[var(--vibe-fg-faint)]">→</span>
                <Plus className="h-5 w-5 text-[var(--accent)]" strokeWidth={2.4} />
                <span className="font-semibold text-[var(--vibe-fg-base)]">Zum Home-Bildschirm</span>
              </div>
            </div>
          ) : platform === "android" && deferred ? (
            <div className="flex max-w-xs flex-col items-center gap-3 text-sm text-[var(--vibe-fg-muted)]">
              <p>Installiere Turnier als App für Vollbild &amp; schnellen Zugriff.</p>
              <button type="button" className={cn(actionBtn, "gap-1.5")} onClick={handleInstall}>
                <Download className="h-4 w-4" strokeWidth={2.4} />
                Jetzt installieren
              </button>
            </div>
          ) : (
            <p className="max-w-xs text-sm text-[var(--vibe-fg-muted)]">
              Über das Browser-Menü kannst du Turnier als App installieren – oder einfach im Browser
              weiternutzen.
            </p>
          )}
        </div>
      ),
    },
  ];

  const isLast = slide === slides.length - 1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col bg-[var(--vibe-bg-base)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Einführung"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "var(--accent-glow)" }}
            aria-hidden
          />
          {/* Überspringen */}
          <div className="relative flex justify-end p-4">
            <button
              type="button"
              onClick={finish}
              className={cn(ghostBtn, "gap-1 text-xs")}
              aria-label="Einführung überspringen"
            >
              Überspringen
              <X className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
          </div>

          {/* Slide */}
          <div className="relative flex flex-1 items-center justify-center px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={slides[slide].key}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 14 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -10 }}
                transition={
                  reduce ? { duration: 0.15 } : { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }
                }
                className="w-full max-w-sm"
              >
                {slides[slide].content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots + Navigation */}
          <div className="relative flex flex-col items-center gap-4 p-6">
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === slide
                      ? "w-6 bg-[var(--accent)]"
                      : "w-2 bg-[var(--vibe-line-strong)]",
                  )}
                />
              ))}
            </div>
            <div className="flex w-full max-w-sm items-center justify-between gap-3">
              {slide > 0 ? (
                <button type="button" className={subtleBtn} onClick={() => setSlide((s) => s - 1)}>
                  Zurück
                </button>
              ) : (
                <span />
              )}
              {isLast ? (
                <button type="button" className={cn(actionBtn, "flex-1 sm:flex-none")} onClick={finish}>
                  Los geht&apos;s
                </button>
              ) : (
                <button
                  type="button"
                  className={cn(actionBtn, "flex-1 sm:flex-none")}
                  onClick={() => setSlide((s) => s + 1)}
                >
                  Weiter
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
