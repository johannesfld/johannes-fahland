"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { actionBtn, dangerBtn, subtleBtn } from "@/components/turnier/styles";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "accent" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

/** Bouncy Clay-Bestätigungsdialog (ersetzt window.confirm). */
export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  tone = "accent",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button
            type="button"
            aria-label="Schließen"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-[var(--vibe-fg-base)]/30 backdrop-blur-[2px]"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.26, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 flex w-full max-w-sm flex-col gap-3 rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-overlay)] p-5 shadow-[var(--vibe-shadow-lifted)]"
          >
            <h2 className="font-display text-lg font-extrabold tracking-tight text-[var(--vibe-fg-base)]">
              {title}
            </h2>
            {body ? <p className="text-sm text-[var(--vibe-fg-muted)]">{body}</p> : null}
            <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={subtleBtn} onClick={onCancel}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={tone === "danger" ? dangerBtn : actionBtn}
                onClick={onConfirm}
                autoFocus
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
