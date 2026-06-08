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
            <stop offset="0%" stopColor="#9C7FE2" />
            <stop offset="100%" stopColor="#4F3399" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="100" fill="url(#offline-grad)" />
        <g transform="translate(256, 256)">
          <path
            d="M -80 -110 L 0 80 L 80 -110"
            stroke="white"
            strokeWidth="22"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="-120" cy="-40" r="14" fill="white" opacity="0.8" />
          <circle cx="120" cy="-40" r="14" fill="white" opacity="0.8" />
        </g>
      </svg>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" style={{ color: "var(--vibe-fg-base)" }}>
          Du bist offline
        </h1>
        <p className="text-base max-w-xs" style={{ color: "var(--vibe-fg-muted)" }}>
          Sobald du wieder Empfang hast, geht&apos;s weiter. Der Wizard funktioniert auch ohne Netz — deine Daten sind lokal gespeichert.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="min-h-11 rounded-[var(--vibe-r-lg)] bg-[var(--brand-500)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98]"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
