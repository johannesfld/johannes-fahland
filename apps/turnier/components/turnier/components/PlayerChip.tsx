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
        "inline-flex min-h-11 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-2 text-sm font-semibold tracking-tight",
        active
          ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--vibe-fg-base)]"
          : "border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] text-[var(--vibe-fg-faint)] line-through",
      ].join(" ")}
    >
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--vibe-bg-overlay)] text-xs font-bold uppercase text-[var(--accent)]">
        {name.slice(0, 1)}
      </span>
      <span className="max-w-32 truncate sm:max-w-40">{name}</span>
      {reactivatable && !active && onReactivate ? (
        <button
          type="button"
          onClick={onReactivate}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-base font-bold text-[var(--accent-ink)] transition duration-200 [@media(hover:hover)]:hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vibe-bg-base)]"
          aria-label={`${name} wieder hinzufügen`}
        >
          +
        </button>
      ) : null}
      {removable && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--vibe-bg-overlay)] text-base font-bold text-[var(--vibe-fg-muted)] transition duration-200 [@media(hover:hover)]:hover:bg-[var(--danger)] [@media(hover:hover)]:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vibe-bg-base)]"
          aria-label={`${name} entfernen`}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
