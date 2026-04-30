/**
 * Nicht-blockierendes Overlay (pointer-events-none): Inhalt bleibt lesbar/scrollbar.
 */
export function PausedScreenBanner() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex justify-center rounded-3xl bg-zinc-950/40 pt-10 sm:pt-14"
      role="status"
      aria-live="polite"
    >
      <div className="mx-4 h-fit max-w-md rounded-2xl border border-[#4C9170]/50 bg-[#06331D]/95 px-4 py-3 text-center shadow-md dark:bg-[#06331D]/95">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#DAF7E9]">Spiel pausiert</p>
        <p className="mt-1 text-xs text-zinc-300">Zum Fortsetzen oben auf „Fortsetzen“ klicken.</p>
      </div>
    </div>
  );
}
