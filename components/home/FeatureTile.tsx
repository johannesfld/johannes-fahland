"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/components/ui/styles";
import type { LucideIcon } from "lucide-react";

const MotionLink = motion.create(Link);

const ease = [0.22, 1, 0.36, 1] as const;

export const tileVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease, delay: i * 0.06 },
  }),
};

type FeatureTileProps = {
  href: string;
  tool: string;
  wordmark: React.ReactNode;
  icon: LucideIcon;
  meta: string;
  pattern?: React.ReactNode;
  reduced?: boolean | null;
  index?: number;
  className?: string;
};

export function FeatureTile({
  href,
  tool,
  wordmark,
  icon: Icon,
  meta,
  pattern,
  reduced,
  index = 0,
  className,
}: FeatureTileProps) {
  return (
    <div data-tool={tool}>
      <MotionLink
        href={href}
        custom={index}
        variants={reduced ? undefined : tileVariants}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden",
          "rounded-[var(--vibe-r-xl)] border border-[var(--accent-line)]",
          "bg-[var(--tool-surface)]",
          "p-5 sm:p-6",
          "shadow-[var(--vibe-shadow-flat)]",
          "transition-all duration-[var(--vibe-dur-2)] ease-[var(--vibe-ease-smooth)]",
          "hover:-translate-y-0.5 hover:shadow-[var(--vibe-shadow-soft)] hover:border-[var(--accent)]",
          "active:scale-[0.99] active:translate-y-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
          className,
        )}
      >
        {/* Subtle pattern overlay (tool-specific) */}
        {pattern && (
          <div className="pointer-events-none absolute inset-0 opacity-100">
            {pattern}
          </div>
        )}

        {/* Top-left: Icon box */}
        <div className="relative mb-auto">
          <div className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-[var(--vibe-r-md)]",
            "bg-[var(--accent)] bg-opacity-10",
            "transition-colors duration-[var(--vibe-dur-2)] group-hover:bg-opacity-18",
          )}
            style={{ backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
          >
            <Icon
              size={19}
              className="text-[var(--accent)] transition-transform duration-[var(--vibe-dur-2)] group-hover:scale-110"
              aria-hidden
            />
          </div>
        </div>

        {/* Bottom: Wordmark + meta */}
        <div className="relative mt-8 flex flex-col gap-1.5">
          {/* Meta pill */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)] opacity-70">
            {meta}
          </p>
          {/* Wordmark — rendered by caller for font control */}
          <div className="text-[var(--accent-ink)] transition-all duration-[var(--vibe-dur-2)]">
            {wordmark}
          </div>
        </div>

        {/* Arrow indicator */}
        <span className="absolute bottom-5 right-5 text-xs font-bold text-[var(--accent)] opacity-50 transition-all duration-[var(--vibe-dur-2)] group-hover:opacity-100 group-hover:translate-x-0.5">
          →
        </span>
      </MotionLink>
    </div>
  );
}
