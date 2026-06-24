export const turnierShell =
  "relative h-full min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden bg-[var(--vibe-bg-base)] text-[var(--vibe-fg-base)]";

// Clay-Karte: dicke Radien, weicher doppelter Schatten, Highlight-Kante.
export const turnierCard =
  "rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-4 shadow-[var(--vibe-shadow-clay)] min-w-0 sm:p-5 lg:p-6";

export const selectStyled =
  "min-h-12 min-w-0 appearance-none rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] bg-[length:14px_14px] bg-[right_0.85rem_center] bg-no-repeat pl-3.5 pr-9 py-2 text-sm font-semibold text-[var(--vibe-fg-base)] shadow-[var(--vibe-shadow-flat)] transition duration-200 ease-out hover:border-[var(--accent-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vibe-bg-base)] disabled:opacity-40 disabled:pointer-events-none";

// Chevron in gedecktem Bleistift-Ton (warm).
export const selectChevron = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23A8A29E' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
} as const;

// Primär: softer Coral-Clay-Button mit Spring-Pop & weichem Schatten.
export const actionBtn =
  "inline-flex min-h-12 items-center justify-center rounded-[var(--vibe-r-xl)] bg-[var(--accent)] px-5 py-2.5 text-sm font-bold tracking-tight text-[var(--accent-ink)] shadow-[var(--vibe-shadow-clay)] transition-[transform,filter,box-shadow] duration-200 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:brightness-[1.04] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vibe-bg-base)] disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0";

// Sekundär: Cream-Karte mit weicher Clay-Kante.
export const subtleBtn =
  "inline-flex min-h-12 items-center justify-center rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-5 py-2.5 text-sm font-semibold tracking-tight text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-soft)] transition-[transform,border-color,color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-[var(--accent-line)] [@media(hover:hover)]:hover:text-[var(--vibe-fg-base)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vibe-bg-base)] disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0";

// Tertiär: schwebender Ghost-Button ohne Fläche.
export const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--vibe-r-lg)] px-3 py-2 text-sm font-semibold tracking-tight text-[var(--vibe-fg-muted)] transition duration-150 [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)] [@media(hover:hover)]:hover:text-[var(--vibe-fg-base)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 disabled:opacity-40 disabled:pointer-events-none";

// Gefahr: softes Rot, Clay-Pop.
export const dangerBtn =
  "inline-flex min-h-12 items-center justify-center rounded-[var(--vibe-r-xl)] bg-[var(--danger)] px-5 py-2.5 text-sm font-bold tracking-tight text-white shadow-[var(--vibe-shadow-clay)] transition-[transform,filter] duration-200 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:brightness-[1.04] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vibe-bg-base)] disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0";

// Stepper-Tap-Button (±) für die Score-Eingabe — rund, Coral-soft, kräftiger Pop.
export const stepperBtn =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--vibe-shadow-soft)] transition-transform duration-150 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:brightness-[1.03] active:scale-[0.88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 disabled:opacity-30 disabled:pointer-events-none";

// Pill-Toggle für Format/Best-of (Segmented-Look).
export const pillToggle =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition-[transform,background-color,color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60";

// Wiederverwendbares dezentes Section-Label.
export const sectionLabel =
  "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--vibe-fg-faint)]";

// Skeleton-Fläche (pulsierendes Clay) — siehe globals.css @keyframes turnier-pulse.
export const skeleton =
  "animate-[turnier-pulse_1.6s_ease-in-out_infinite] rounded-[var(--vibe-r-lg)] bg-[var(--vibe-bg-sunken)]";
