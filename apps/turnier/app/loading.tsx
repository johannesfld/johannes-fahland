import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";

/** Route-Loading für die Startseite (Turnierliste) — Clay-Skeletons. */
export default function Loading() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <div className="flex flex-col gap-4 rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-4 shadow-[var(--vibe-shadow-clay)] sm:p-6">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-10 rounded-[var(--vibe-r-md)]" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2.5 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
