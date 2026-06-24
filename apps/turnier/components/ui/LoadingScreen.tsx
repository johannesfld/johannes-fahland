import { Brandmark } from "@/components/ui/Brandmark";
import { Spinner } from "@/components/ui/Spinner";

type LoadingScreenProps = {
  label?: string;
};

/** Vollflächiger Clay-Ladescreen mit Logo + bouncy Dots (Route-Transitions). */
export function LoadingScreen({ label = "Wird geladen…" }: LoadingScreenProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center gap-5 bg-[var(--vibe-bg-base)] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[var(--vibe-r-2xl)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--vibe-shadow-clay)]">
        <Brandmark size={34} />
      </div>
      <Spinner size={9} />
      <p className="text-sm font-semibold text-[var(--vibe-fg-muted)]">{label}</p>
    </div>
  );
}
