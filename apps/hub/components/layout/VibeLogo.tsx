import { cn } from "@/components/ui/styles";

/**
 * Spielbrett-Logo: 4×4 Punkteraster wie auf einer Würfelfläche.
 * Aktive Punkte sind als Subset in Brand-/Tool-Farbe (`currentColor`).
 * Inaktive sind blasses Hintergrundgitter (`var(--vibe-fg-faint)`).
 *
 * Per-Tool-Kontext (via `[data-tool="x"]`-Wrapper) tönt das Logo automatisch
 * in der jeweiligen Tool-Farbe, weil das umschließende Element die Akzentfarbe
 * via CSS-Vars setzt und wir `currentColor` nutzen.
 */
type SpielbrettLogoProps = {
  size?: number;
  className?: string;
};

const DOT_R = 1.6;
const COORDS = [3, 11, 19, 27] as const;
const ACTIVE = new Set<string>([
  "11,3", "19,3", "27,3",
  "3,11", "11,11",
  "19,19", "27,19",
  "3,27", "11,27", "19,27",
]);

export function VibeLogo({ size = 36, className }: SpielbrettLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      {COORDS.flatMap((y) =>
        COORDS.map((x) => {
          const key = `${x},${y}`;
          const isActive = ACTIVE.has(key);
          return (
            <circle
              key={key}
              cx={x}
              cy={y}
              r={DOT_R}
              fill={isActive ? "currentColor" : "var(--vibe-fg-faint)"}
              opacity={isActive ? 1 : 0.22}
            />
          );
        }),
      )}
    </svg>
  );
}

type SpielbrettWordmarkProps = {
  className?: string;
};

export function VibeWordmark({ className }: SpielbrettWordmarkProps) {
  return (
    <span
      className={cn(
        "font-display text-base font-semibold tracking-[-0.01em] text-[var(--vibe-fg-base)]",
        className,
      )}
    >
      Spielbrett
    </span>
  );
}
