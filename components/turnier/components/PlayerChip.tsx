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
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold tracking-tight sm:min-h-11 sm:px-4 sm:text-sm",
        active
          ? "border-[#8DC4AA] bg-[#DAF7E9] text-[#06331D] dark:border-[#4C9170]/60 dark:bg-[#1E5E3F]/40 dark:text-[#DAF7E9]"
          : "border-zinc-300 bg-zinc-100 text-zinc-500 line-through dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500",
      ].join(" ")}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black uppercase text-[#4C9170] sm:h-6 sm:w-6 sm:text-xs dark:bg-[#06331D] dark:text-[#8DC4AA]">
        {name.slice(0, 1)}
      </span>
      <span className="max-w-28 truncate sm:max-w-32">{name}</span>
      {reactivatable && !active && onReactivate ? (
        <button
          type="button"
          onClick={onReactivate}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#4C9170] text-[10px] font-black text-white transition duration-200 hover:bg-[#1E5E3F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DC4AA]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:h-7 sm:w-7 sm:text-xs dark:focus-visible:ring-offset-zinc-950"
          aria-label={`${name} wieder hinzufügen`}
        >
          +
        </button>
      ) : null}
      {removable && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-black text-white transition duration-200 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C9170]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:h-7 sm:w-7 sm:text-xs dark:bg-zinc-100 dark:text-zinc-900 dark:focus-visible:ring-offset-zinc-950"
          aria-label={`${name} entfernen`}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
