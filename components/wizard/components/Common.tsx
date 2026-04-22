import { IconAlert, IconClose } from "@/components/ui/icons";

export function BigNumber({ value }: { value: number }) {
  return (
    <div
      className={
        "flex min-h-[5rem] min-w-[6rem] items-center justify-center rounded-2xl border-4 border-amber-500 " +
        "bg-amber-50 text-5xl font-serif font-bold tabular-nums text-amber-900 shadow-inner shadow-amber-900/10 " +
        "dark:border-amber-400 dark:bg-slate-950 dark:text-amber-200 md:min-h-[5.5rem] md:min-w-[8rem] md:text-6xl"
      }
      aria-live="polite"
      aria-label={`Wert ${value}`}
    >
      {value}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className={
        "flex items-start justify-center gap-2 rounded-2xl border border-red-300/80 bg-red-50/95 p-3 text-center " +
        "text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-100"
      }
      role="alert"
    >
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
      <span>{message}</span>
    </div>
  );
}

export function CloseGameButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border " +
        "border-amber-200/80 bg-white/90 text-zinc-500 transition-colors hover:border-red-300 hover:text-red-600 " +
        "dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-red-500/50 dark:hover:text-red-400 md:right-4 md:top-4"
      }
      aria-label="Spiel beenden"
    >
      <IconClose className="h-5 w-5" />
    </button>
  );
}
