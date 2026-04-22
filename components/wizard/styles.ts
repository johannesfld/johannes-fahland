export const shell =
  "relative z-0 flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden font-sans selection:bg-amber-500/25 " +
  "bg-gradient-to-b from-amber-50 via-stone-100 to-amber-100/95 text-amber-950 " +
  "dark:from-[#080d18] dark:via-[#0f172a] dark:to-[#020617] dark:text-amber-50";

export const card =
  "rounded-[2rem] border backdrop-blur-xl shadow-md " +
  "border-amber-200/60 bg-white/75 shadow-amber-900/5 " +
  "dark:border-amber-900/35 dark:bg-slate-900/45 dark:shadow-black/30";

export const glow =
  "pointer-events-none absolute inset-0 opacity-80 dark:opacity-100 " +
  "bg-[radial-gradient(ellipse_100%_70%_at_50%_-25%,#fde68a,transparent)] " +
  "dark:bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)]";

export const primaryBtn =
  "w-full rounded-2xl bg-amber-500 py-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-md " +
  "transition duration-200 hover:bg-amber-400 active:scale-[0.98] dark:text-slate-950 dark:hover:bg-amber-400 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 " +
  "touch-manipulation";

export const stepperBtn =
  "flex h-16 flex-1 items-center justify-center rounded-xl border-2 border-amber-500 bg-white/90 text-amber-700 " +
  "transition duration-200 hover:bg-amber-50 active:scale-[0.98] dark:border-amber-400 dark:bg-slate-900/80 dark:text-amber-300 " +
  "dark:hover:bg-slate-800 md:h-16 md:w-16 md:flex-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 " +
  "touch-manipulation";

export const stageCenterWrap =
  "relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-y-contain px-4 py-4 " +
  "pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]";
