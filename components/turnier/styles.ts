/** Turniertool: Palette #DAF7E9, #8DC4AA, #4C9170, #1E5E3F, #06331D */
export const turnierShell =
  "relative h-full min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#DAF7E9] via-white to-zinc-100 text-zinc-900 dark:from-[#06331D] dark:via-[#1E5E3F] dark:to-[#050507] dark:text-zinc-100";

export const turnierCard =
  "rounded-3xl border border-zinc-200/90 bg-white/95 p-4 shadow-sm min-w-0 dark:border-[#1E5E3F]/50 dark:bg-[#06331D]/40 dark:shadow-black/30";

export const selectStyled =
  "min-h-11 min-w-0 appearance-none rounded-xl border border-zinc-300 bg-white bg-[length:14px_14px] bg-[right_0.85rem_center] bg-no-repeat pl-3 pr-9 py-2 text-sm font-semibold text-zinc-700 transition duration-200 ease-out hover:border-[#4C9170] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C9170]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus-visible:ring-offset-zinc-950";

export const selectChevron = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231E5E3F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
} as const;

export const actionBtn =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#4C9170] px-4 py-2 text-sm font-black uppercase tracking-wide text-white transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#1E5E3F] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DC4AA]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0 dark:text-[#DAF7E9] dark:hover:bg-[#8DC4AA] dark:hover:text-[#06331D] dark:focus-visible:ring-offset-zinc-950";

export const subtleBtn =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold tracking-tight text-zinc-700 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#4C9170] hover:text-[#1E5E3F] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C9170]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-[#8DC4AA] dark:focus-visible:ring-offset-zinc-950";

export const dangerBtn =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-red-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0 dark:focus-visible:ring-offset-zinc-950";
