import { cn } from "@/components/ui/styles";

type VibeLogoProps = {
  size?: number;
  className?: string;
};

export function VibeLogo({ size = 36, className }: VibeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      {/* Background dots grid — faint */}
      <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.15" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" opacity="0.15" />
      <circle cx="30" cy="6" r="1.5" fill="currentColor" opacity="0.15" />
      <circle cx="6" cy="30" r="1.5" fill="currentColor" opacity="0.15" />
      <circle cx="30" cy="30" r="1.5" fill="currentColor" opacity="0.15" />
      {/* Bracket path */}
      <path
        d="M6 11 C6 8.24 8.24 6 11 6 L25 6 C27.76 6 30 8.24 30 11 L30 25 C30 27.76 27.76 30 25 30 L11 30 C8.24 30 6 27.76 6 25 Z"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Central vibe dot */}
      <circle cx="18" cy="18" r="4" fill="var(--accent)" />
    </svg>
  );
}

type VibeWordmarkProps = {
  className?: string;
};

export function VibeWordmark({ className }: VibeWordmarkProps) {
  return (
    <span
      className={cn(
        "font-sans text-sm font-semibold tracking-[-0.02em] text-[var(--vibe-fg-base)]",
        className,
      )}
    >
      vibecode
    </span>
  );
}
