/**
 * Nicht-blockierendes Overlay (pointer-events-none): Inhalt bleibt lesbar/scrollbar.
 */
export function PausedScreenBanner() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex justify-center rounded-2xl bg-[var(--vibe-fg-base)]/15 pt-10 backdrop-blur-[1px] sm:pt-14"
      role="status"
      aria-live="polite"
    >
      <div className="mx-4 h-fit max-w-md rounded-2xl border border-[var(--accent-line)] bg-[var(--vibe-bg-overlay)]/95 px-4 py-3 text-center shadow-[var(--vibe-shadow-lifted)]">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
          Spiel pausiert
        </p>
        <p className="mt-1 text-xs text-[var(--vibe-fg-muted)]">
          Zum Fortsetzen oben auf „Fortsetzen“ klicken.
        </p>
      </div>
    </div>
  );
}
