/**
 * Turnier-Brandmark „Bracket" — ein Turnierbaum, der zum Sieger zusammenläuft.
 * Vier Eingangs-Knoten (zwei Paarungen) laufen über abgerundete Clay-Streben
 * zu zwei Zwischenknoten und schließlich zu einem größeren Sieger-Knoten rechts.
 * Solide Knoten-Kreise + dicke Streben (kein Haarstrich) → bis 16px / Favicon lesbar.
 * Färbt sich adaptiv über `currentColor`.
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
      <g
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* Runde 1 → Runde 2: oberes Paar läuft zum oberen Zwischenknoten */}
        <path d="M12 15 H24 a5 5 0 0 1 5 5 V26" />
        <path d="M12 27 H24 a5 5 0 0 0 5 -5 V22" />
        {/* Runde 1 → Runde 2: unteres Paar läuft zum unteren Zwischenknoten */}
        <path d="M12 37 H24 a5 5 0 0 1 5 5 V44" />
        <path d="M12 49 H24 a5 5 0 0 0 5 -5 V40" />
        {/* Runde 2 → Finale: die zwei Zwischenknoten laufen zum Sieger */}
        <path d="M29 22 H40 a5 5 0 0 1 5 5 V34" />
        <path d="M29 42 H40 a5 5 0 0 0 5 -5 V30" />
        {/* Finale → Sieger-Knoten */}
        <path d="M45 32 H52" />
      </g>
      <g fill="currentColor">
        {/* Eingangs-Knoten (Runde 1) */}
        <circle cx="12" cy="15" r="4" />
        <circle cx="12" cy="27" r="4" />
        <circle cx="12" cy="37" r="4" />
        <circle cx="12" cy="49" r="4" />
        {/* Zwischen-Knoten (Runde 2) */}
        <circle cx="29" cy="22" r="4.5" />
        <circle cx="29" cy="42" r="4.5" />
        {/* Sieger-Knoten (größer, betont) */}
        <circle cx="55" cy="32" r="7" />
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
