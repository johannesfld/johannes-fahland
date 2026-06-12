/**
 * Pasch-Logo „Doppelstein": ein Spielstein mit gravierter Mittellinie,
 * ein Auge pro Hälfte. Liest sich als Würfel-Zwei, Einserpasch (zwei
 * Würfel je eine 1) und Domino-Doppelstein zugleich — Spiegelsymmetrie
 * als Markenkonzept ("zwei gleiche"). Knockout in `currentColor`, tönt
 * sich über den umschließenden `[data-tool="x"]`-Wrapper automatisch ein.
 */
type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 36, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className ? `shrink-0 ${className}` : "shrink-0"}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 8 H44 A12 12 0 0 1 56 20 V44 A12 12 0 0 1 44 56 H20 A12 12 0 0 1 8 44 V20 A12 12 0 0 1 20 8 Z
           M13.5 32 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z
           M38.5 32 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z
           M30.75 19.25 a1.25 1.25 0 0 1 2.5 0 v25.5 a1.25 1.25 0 0 1 -2.5 0 Z"
      />
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className }: WordmarkProps) {
  const classes = [
    "font-display text-base font-semibold tracking-[-0.015em] text-[var(--vibe-fg-base)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>Pasch</span>;
}
