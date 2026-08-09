"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

type ToastProps = {
  message: string | null;
  onDismiss: () => void;
  /** Auto-Ausblenden in ms; 0 deaktiviert das automatische Schließen. */
  duration?: number;
};

/**
 * Nicht-blockierender Hinweis. Aktionen laufen optimistisch durch; schlägt eine
 * serverseitig fehl, wird der Zustand zurückgerollt und der Grund hier gezeigt –
 * ohne modalen Dialog, der den Ablauf unterbricht.
 */
export function Toast({ message, onDismiss, duration = 6000 }: ToastProps) {
  useEffect(() => {
    if (!message || duration <= 0) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onDismiss]);

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[60] flex justify-center px-4 desk:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        >
          <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[var(--vibe-r-xl)] border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 shadow-[var(--vibe-shadow-lifted)]">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger-ink)]"
              strokeWidth={2.4}
              aria-hidden
            />
            <p className="min-w-0 flex-1 text-sm font-medium text-[var(--danger-ink)]">{message}</p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Hinweis schließen"
              className="-m-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--danger-ink)] transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]/60"
            >
              <X className="h-4 w-4" strokeWidth={2.6} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
