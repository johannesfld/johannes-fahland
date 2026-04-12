"use client";

import Image from "next/image";
import { useState } from "react";

const SOURCES = ["/logo.png", "/icon-192x192.svg"] as const;

type BrandingLogoProps = {
  className?: string;
  /** Shown when no image loads (last resort) */
  fallbackLetter?: string;
};

/**
 * Tries `public/logo.png` first (drop your PNG there), then falls back to the
 * app icon SVG, then to a styled initial.
 */
export function BrandingLogo({
  className = "",
  fallbackLetter = "V",
}: BrandingLogoProps) {
  const [step, setStep] = useState(0);

  if (step >= SOURCES.length) {
    return (
      <div
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-zinc-950 dark:from-amber-300 dark:to-amber-600",
          className,
        ].join(" ")}
        aria-hidden
      >
        {fallbackLetter}
      </div>
    );
  }

  return (
    <Image
      src={SOURCES[step]}
      alt=""
      width={44}
      height={44}
      unoptimized
      className={[
        "h-11 w-11 shrink-0 rounded-xl object-cover",
        className,
      ].join(" ")}
      onError={() => setStep((s) => s + 1)}
    />
  );
}
