type ClassValue = string | undefined | null | false;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vibe-bg-base)]";

export const buttonBase = cn(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all select-none",
  "disabled:opacity-40 disabled:pointer-events-none",
  focusRing,
);

export const buttonSizes = {
  sm: "h-8 px-3 text-xs rounded-[var(--vibe-r-sm)]",
  md: "h-10 px-4 text-sm rounded-[var(--vibe-r-md)]",
  lg: "h-11 px-4 text-sm rounded-[var(--vibe-r-md)]",
  xl: "h-14 px-6 text-base rounded-[var(--vibe-r-lg)]",
} as const;

export const buttonVariants = {
  primary: cn(
    "bg-[var(--accent)] text-[var(--accent-ink)]",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
    "hover:brightness-95 active:brightness-88 active:scale-[0.985]",
  ),
  secondary: cn(
    "bg-transparent border border-[var(--vibe-line-strong)] text-[var(--vibe-fg-base)]",
    "hover:bg-[var(--vibe-bg-sunken)] hover:border-[var(--accent-line)]",
    "active:scale-[0.985]",
  ),
  ghost: cn(
    "bg-transparent text-[var(--vibe-fg-muted)]",
    "hover:bg-[var(--vibe-bg-sunken)] hover:text-[var(--vibe-fg-base)]",
    "active:scale-[0.985]",
  ),
  danger: cn(
    "bg-[var(--pasch-carmine-soft)] border border-[var(--pasch-carmine)]/30 text-[var(--pasch-carmine-text)]",
    "hover:brightness-95 active:scale-[0.985]",
  ),
} as const;

export const cardBase = cn(
  "bg-[var(--vibe-bg-elevated)] border border-[var(--vibe-line)]",
  "rounded-[var(--vibe-r-lg)] p-5 shadow-[var(--vibe-edge),var(--vibe-shadow-flat)]",
);

export const cardInteractive = cn(
  cardBase,
  "transition-all duration-[var(--vibe-dur-2)] ease-[var(--vibe-ease-smooth)]",
  "cursor-pointer",
  "hover:-translate-y-0.5 hover:shadow-[var(--vibe-edge),var(--vibe-shadow-soft)] hover:border-[var(--accent-line)]",
  "active:translate-y-0 active:scale-[0.99]",
  focusRing,
);

export const cardElevated = cn(
  "bg-[var(--vibe-bg-elevated)] border border-[var(--vibe-line-strong)]",
  "rounded-[var(--vibe-r-xl)] p-7 shadow-[var(--vibe-edge),var(--vibe-shadow-lifted)]",
);

export const inputBase = cn(
  "min-h-11 w-full rounded-[var(--vibe-r-sm)] border border-[var(--vibe-line)]",
  "bg-[var(--vibe-bg-base)] dark:bg-[var(--vibe-bg-sunken)]",
  "px-3 text-base text-[var(--vibe-fg-base)] placeholder:text-[var(--vibe-fg-faint)]",
  "transition-colors duration-[var(--vibe-dur-1)]",
  "focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-25",
);

export const microLabel =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]";
