"use client";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <svg
        width="64"
        height="64"
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="offline-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--vibe-bg-elevated)" />
            <stop offset="100%" stopColor="var(--vibe-bg-sunken)" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="100" fill="url(#offline-grad)" />
        <g transform="translate(256, 256) scale(3.4) translate(-32, -32)">
          <g stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M14 50 L14 40 L32 40 L32 30" />
            <path d="M50 50 L50 40 L32 40" />
            <path d="M32 30 L32 18" />
          </g>
          <circle cx="14" cy="52" r="5" fill="var(--accent)" />
          <circle cx="50" cy="52" r="5" fill="var(--accent)" />
          <circle cx="32" cy="14" r="6" fill="var(--accent)" />
        </g>
      </svg>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-[var(--vibe-fg-base)]">
          Du bist offline
        </h1>
        <p className="max-w-xs text-base text-[var(--vibe-fg-muted)]">
          Sobald du wieder Empfang hast, geht&apos;s weiter. Bereits geladene Turniere bleiben
          bis zum nächsten Sync sichtbar.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="min-h-11 rounded-[var(--vibe-r-lg)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-ink)] shadow-[var(--vibe-shadow-soft)] transition-all hover:brightness-95 active:scale-[0.98]"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
