import { FeatureTiles } from "@/components/home/FeatureTiles";
import { BackgroundPicker } from "@/components/BackgroundPicker";

export default function Home() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 sm:px-0 sm:py-4">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
          Spielabend-Werkzeug
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--vibe-fg-base)]">
          Hallo, Johannes.
        </h1>
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