import { cn } from "@/components/ui/styles";

type SpinnerProps = {
  className?: string;
  /** Pixelgröße der einzelnen Dots. */
  size?: number;
};

/**
 * Bouncy Dots — drei Clay-Punkte, die nacheinander hüpfen.
 * Nutzt eine Inline-Bounce-Animation; reduced-motion friert sie ein (globals.css).
 */
export function Spinner({ className, size = 8 }: SpinnerProps) {
  const dot = "rounded-full bg-current animate-[turnier-pulse_1s_ease-in-out_infinite]";
  return (
    <span
      role="status"
      aria-label="Lädt"
      className={cn("inline-flex items-center gap-1.5 text-[var(--accent)]", className)}
    >
      <span className={dot} style={{ width: size, height: size, animationDelay: "0ms" }} />
      <span className={dot} style={{ width: size, height: size, animationDelay: "160ms" }} />
      <span className={dot} style={{ width: size, height: size, animationDelay: "320ms" }} />
    </span>
  );
}
