"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./styles";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function Sheet({ open, onClose, children, className }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={sheetRef}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] overflow-y-auto",
              "rounded-t-[var(--vibe-r-2xl)] border-t border-[var(--vibe-line)]",
              "bg-[var(--vibe-bg-elevated)] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4",
              "shadow-[var(--vibe-shadow-lifted)]",
              className,
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--vibe-line-strong)]" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
