"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/components/ui/styles";
import type { LucideIcon } from "lucide-react";

const MotionLink = motion.create(Link);

const spring = [0.3, 1.36, 0.64, 1] as const;

/** "Karten geben": Tiles werden wie ausgeteilte Spielkarten eingedreht. */
export const tileVariants = {
  hidden: { opacity: 0, y: 12, rotate: -1 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.45, ease: spring, delay: i * 0.045 },
  }),
};

type FeatureTileProps = {
  href: string;
  tool: string;
  index: string;
  wordmark: React.ReactNode;
  icon: LucideIcon;
  meta: string;
  pattern?: React.ReactNode;
  reduced?: boolean | null;
  staggerIndex?: number;
  className?: string;
};

export function FeatureTile({
  href,
  tool,
  index,
  wordmark,
  icon: Icon,
  meta,
  pattern,
  reduced,
  staggerIndex = 0,
  className,
}: FeatureTileProps) {
  return (
    <div data-tool={tool}>
      <MotionLink
        href={href}
        custom={staggerIndex}
        variants={reduced ? undefined : tileVariants}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden",
          "rounded-[var(--vibe-r-xl)] border border-[var(--accent-line)]",
          "bg-[var(--tool-surface)]",
          "p-5 sm:p-6",
          "shadow-[var(--vibe-edge),var(--vibe-shadow-flat)]",
          "transition-all duration-[var(--vibe-dur-2)] ease-[var(--vibe-ease-smooth)]",
          "hover:-translate-y-0.5 hover:shadow-[var(--vibe-edge),var(--vibe-shadow-soft)] hover:border-[var(--accent)]",
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

        {/* Ecken-Index oben links: Tool-Initial + Akzent-Pip (Spielkarten-Eckzahl) */}
        <div className="relative mb-auto flex items-center gap-1.5">
          <span
            className="font-display text-lg font-semibold leading-none text-[var(--accent-ink)]"
            aria-hidden
          >
            {index}
          </span>
          <Icon
            size={13}
            className="text-[var(--accent)] opacity-70"
            aria-hidden
          />
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

        {/* Ecken-Index unten rechts: 180°-gespiegeltes "Doppel" der oberen Ecke */}
        <div className="absolute bottom-5 right-5 flex items-center gap-1.5 rotate-180 transition-opacity duration-[var(--vibe-dur-2)]">
          <span
            className="font-display text-lg font-semibold leading-none text-[var(--accent-ink)] opacity-50 group-hover:opacity-80"
            aria-hidden
          >
            {index}
          </span>
          <Icon
            size={13}
            className="text-[var(--accent)] opacity-40 transition-transform duration-[var(--vibe-dur-2)] group-hover:translate-x-0.5 group-hover:opacity-70"
            aria-hidden
          />
        </div>
      </MotionLink>
    </div>
  );
}
