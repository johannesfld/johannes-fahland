/**
 * Turnier-Brandmark „Clay" — gefülltes Bracket-Monogramm „T".
 * Ein solides T (Stamm + Krone); die rechte Seite der Krone verzweigt als
 * zwei abgerundete Bracket-Äste, die zu einem größeren Sieger-Knoten
 * zusammenlaufen — lesbar als „zwei treffen aufeinander, einer steigt auf".
 * Solide Flächen (kein dünner Stroke) → bis 16px / Favicon lesbar.
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
      <g fill="currentColor">
        {/* T-Krone (oberer Querbalken), abgerundet */}
        <rect x="10" y="12" width="34" height="11" rx="5.5" />
        {/* T-Stamm */}
        <rect x="21.5" y="18" width="11" height="36" rx="5.5" />
        {/* Bracket-Ast oben: von Kronenende nach rechts/oben zum Sieger */}
        <path
          d="M40 17.5 H47 a4.5 4.5 0 0 1 4.5 4.5 V30 a4.5 4.5 0 0 0 4.5 4.5"
          stroke="currentColor"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Bracket-Ast unten: von Stammhöhe nach rechts/unten zum Sieger */}
        <path
          d="M40 51 H47 a4.5 4.5 0 0 0 4.5 -4.5 V39 a4.5 4.5 0 0 1 4.5 -4.5"
          stroke="currentColor"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Sieger-Knoten */}
        <circle cx="56" cy="34.5" r="6.5" />
      </g>
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className }: WordmarkProps) {
  const classes = [
    "font-display text-base font-extrabold tracking-[-0.02em] text-[var(--vibe-fg-base)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>Turnier</span>;
}
