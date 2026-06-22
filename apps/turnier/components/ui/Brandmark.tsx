/**
 * Turnier-Brandmark — eigenständige Identität (kein Pasch-Doppelstein).
 * Ein stilisierter Turnierbaum/Bracket: zwei zusammenlaufende Linien zu
 * einem Knoten oben — lesbar als „zwei treffen aufeinander, einer steigt auf".
 * Färbt sich über `currentColor`.
 */
type LogoProps = {
  size?: number;
  className?: string;
};

export function Brandmark({ size = 28, className }: LogoProps) {
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
      {/* Bracket: zwei untere Knoten -> Halbfinale -> Sieger oben */}
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M14 50 L14 40 L32 40 L32 30" />
        <path d="M50 50 L50 40 L32 40" />
        <path d="M32 30 L32 18" />
      </g>
      {/* Knoten */}
      <circle cx="14" cy="52" r="5" fill="currentColor" />
      <circle cx="50" cy="52" r="5" fill="currentColor" />
      <circle cx="32" cy="14" r="6" fill="currentColor" />
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className }: WordmarkProps) {
  const classes = [
    "font-display text-base font-semibold tracking-[-0.01em] text-[var(--vibe-fg-base)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>Turnier</span>;
}
