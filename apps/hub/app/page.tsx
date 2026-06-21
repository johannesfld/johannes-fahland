import { Logo as PaschLogo } from "@pasch/ui";
import { FeatureTiles } from "@/components/home/FeatureTiles";
import { BackgroundPicker } from "@/components/BackgroundPicker";

export default function Home() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-[calc(72px+env(safe-area-inset-bottom,0px))] pt-[max(1.5rem,calc(env(safe-area-inset-top,0px)+0.75rem))] sm:px-0 desk:pb-6 desk:pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--vibe-r-lg)] bg-[var(--brand-500)] text-[var(--brand-50)] shadow-[var(--vibe-shadow-soft)] desk:hidden">
          <PaschLogo size={24} />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
            Spielabend-Werkzeug
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--vibe-fg-base)]">
            Hallo, Johannes.
          </h1>
        </div>
      </div>
      {/* Grid */}
      <FeatureTiles />

      {/* Hintergrund-Auswahl — v.a. für Mobile (ohne Sidebar) erreichbar */}
      <div className="mt-2 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]/60 p-4 desk:hidden">
        <BackgroundPicker variant="full" />
      </div>
    </div>
  );
}