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
  reduced,
  staggerIndex = 0,
  className,
}: FeatureTileProps) {
  return (
    <div data-tool={tool} className="feature-tile-host">
      <MotionLink
        href={href}
        custom={staggerIndex}
        variants={reduced ? undefined : tileVariants}
        className={cn(
          "feature-tile group relative flex h-full flex-col overflow-hidden",
          "rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)]",
          "p-5 sm:p-6",
          "shadow-[var(--vibe-edge),var(--vibe-shadow-flat)]",
          "transition-all duration-[var(--vibe-dur-2)] ease-[var(--vibe-ease-smooth)]",
          "hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--vibe-edge),var(--vibe-shadow-soft)]",
          "active:scale-[0.99] active:translate-y-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vibe-bg-base)]",
          className,
        )}
      >
        {/* Akzent-Schimmer am oberen Rand — Spielfarbe als zarter Lichtsaum */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--accent)] opacity-40 group-hover:opacity-70 transition-opacity duration-[var(--vibe-dur-2)]"
        />

        {/* Ecken-Index oben links: Tool-Initial + Akzent-Pip (Spielkarten-Eckzahl) */}
        <div className="relative mb-auto flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-[var(--vibe-r-sm)] bg-[var(--accent-soft)] font-display text-sm font-bold leading-none text-[var(--accent-ink)]"
            aria-hidden
          >
            {index}
          </span>
          <Icon size={15} className="text-[var(--accent)]" aria-hidden />
        </div>

        {/* Bottom: Wordmark + meta */}
        <div className="relative mt-8 flex flex-col gap-1.5">
          {/* Meta pill */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)] opacity-80">
            {meta}
          </p>
          {/* Wordmark — rendered by caller for font control */}
          <div className="text-[var(--vibe-fg-base)] transition-colors duration-[var(--vibe-dur-2)] group-hover:text-[var(--accent-ink)]">
            {wordmark}
          </div>
        </div>

        {/* Ecken-Index unten rechts: 180°-gespiegeltes "Doppel" der oberen Ecke */}
        <div className="absolute bottom-5 right-5 rotate-180 transition-opacity duration-[var(--vibe-dur-2)]">
          <span
            className="font-display text-lg font-bold leading-none text-[var(--accent-ink)] opacity-40 group-hover:opacity-70"
            aria-hidden
          >
            {index}
          </span>
        </div>
      </MotionLink>
    </div>
  );
}
