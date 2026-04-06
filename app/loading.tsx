export default function Loading() {
  return (
    <div
      className="flex min-h-[50vh] flex-col gap-6 py-2"
      role="status"
      aria-live="polite"
      aria-label="Laden"
    >
      <div className="h-36 animate-pulse rounded-2xl bg-zinc-200/90 dark:bg-zinc-800/60" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/50"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
