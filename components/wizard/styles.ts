export const shell =
  "relative z-0 flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden font-sans selection:bg-[var(--accent)]/25 " +
  "bg-[var(--vibe-bg-base)] text-[var(--vibe-fg-base)]";

export const card =
  "rounded-[2rem] border backdrop-blur-xl shadow-md " +
  "border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/80 shadow-[var(--vibe-shadow-soft)]";

export const glow =
  "pointer-events-none absolute inset-0 opacity-60 " +
  "bg-[radial-gradient(ellipse_100%_60%_at_50%_-25%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent)]";

export const primaryBtn =
  "w-full rounded-2xl bg-[var(--accent)] py-4 text-sm font-black uppercase tracking-wider text-[var(--accent-ink)] shadow-md " +
  "transition duration-200 hover:brightness-95 active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 " +
  "touch-manipulation";

export const stepperBtn =
  "flex h-16 flex-1 items-center justify-center rounded-xl border-2 border-[var(--accent-line)] bg-[var(--vibe-bg-elevated)] text-[var(--accent)] " +
  "transition duration-200 hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] active:scale-[0.98] " +
  "md:h-16 md:w-16 md:flex-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 " +
  "touch-manipulation";

export const stageCenterWrap =
  "relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-4 " +
  "pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]";
