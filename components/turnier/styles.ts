export const turnierShell =
  "relative h-full min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden bg-[var(--vibe-bg-base)] text-[var(--vibe-fg-base)]";

export const turnierCard =
  "rounded-3xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-4 shadow-[var(--vibe-shadow-soft)] min-w-0";

export const selectStyled =
  "min-h-11 min-w-0 appearance-none rounded-xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] bg-[length:14px_14px] bg-[right_0.85rem_center] bg-no-repeat pl-3 pr-9 py-2 text-sm font-semibold text-[var(--vibe-fg-base)] transition duration-200 ease-out hover:border-[var(--accent-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none";

export const selectChevron = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234C9170' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
} as const;

export const actionBtn =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-black uppercase tracking-wide text-[var(--accent-ink)] transition duration-200 ease-out hover:-translate-y-0.5 hover:brightness-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0";

export const subtleBtn =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-4 py-2 text-sm font-semibold tracking-tight text-[var(--vibe-fg-base)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--accent-line)] hover:text-[var(--accent)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0";

export const dangerBtn =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-red-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0";
