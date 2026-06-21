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
        {/* Spielsymbol oben — nur das farbige Icon, kein bunter Kasten, keine Kante. */}
        <Icon
          size={26}
          strokeWidth={2}
          className="relative mb-auto text-[var(--accent)] transition-transform duration-[var(--vibe-dur-2)] group-hover:scale-105"
          aria-hidden
        />

        {/* Titel + Nebentitel */}
        <div className="relative mt-8 flex flex-col gap-1">
          {/* Titel (Hanken Grotesk, vom Caller gesetzt) */}
          <div className="text-[var(--vibe-fg-base)] transition-colors duration-[var(--vibe-dur-2)] group-hover:text-[var(--accent-ink)]">
            {wordmark}
          </div>
          {/* Nebentitel: Spielmodus */}
          <p className="text-[11px] font-medium text-[var(--vibe-fg-faint)]">
            {meta}
          </p>
        </div>
      </MotionLink>
    </div>
  );
}
