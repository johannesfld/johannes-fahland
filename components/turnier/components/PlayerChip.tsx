type PlayerChipProps = {
  name: string;
  active?: boolean;
  removable?: boolean;
  reactivatable?: boolean;
  onRemove?: () => void;
  onReactivate?: () => void;
};

export function PlayerChip({
  name,
  active = true,
  removable = false,
  reactivatable = false,
  onRemove,
  onReactivate,
}: PlayerChipProps) {
  return (
    <div
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold tracking-tight",
        active
          ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
          : "border-zinc-300 bg-zinc-100 text-zinc-500 line-through dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500",
      ].join(" ")}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black uppercase text-amber-600 dark:bg-zinc-900 dark:text-amber-400">
        {name.slice(0, 1)}
      </span>
      <span className="max-w-32 truncate">{name}</span>
      {reactivatable && !active && onReactivate ? (
        <button
          type="button"
          onClick={onReactivate}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white transition duration-200 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
          aria-label={`${name} wieder hinzufügen`}
        >
          +
        </button>
      ) : null}
      {removable && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-black text-white transition duration-200 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-zinc-100 dark:text-zinc-900 dark:focus-visible:ring-offset-zinc-950"
          aria-label={`${name} entfernen`}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
