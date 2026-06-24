import { cn } from "@/components/ui/styles";

type SkeletonProps = {
  className?: string;
};

/** Sanft pulsierende Clay-Ladefläche. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-[turnier-pulse_1.6s_ease-in-out_infinite] rounded-[var(--vibe-r-lg)] bg-[var(--vibe-bg-sunken)]",
        className,
      )}
    />
  );
}

/** Clay-Karten-Skelett: imitiert eine turnierCard mit ein paar Zeilen. */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-col gap-3 rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-4 shadow-[var(--vibe-shadow-soft)] sm:p-5",
        className,
      )}
    >
      <Skeleton className="h-3 w-16 rounded-full" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
