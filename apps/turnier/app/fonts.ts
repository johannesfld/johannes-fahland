import { Plus_Jakarta_Sans, Spline_Sans_Mono } from "next/font/google";

// Display — runde, freundliche Headlines (Clay/Soft Play). Bold/Extrabold.
// Export-Name `serif` bleibt aus Kompatibilität, zeigt jetzt auf Jakarta.
export const serif = Plus_Jakarta_Sans({
  variable: "--font-display-spec",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  preload: true,
});

// UI & Body — dieselbe Familie in leichteren Schnitten, für ein kohärentes Clay-Gefühl.
export const grotesk = Plus_Jakarta_Sans({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

// Mono — Scores & Zahlen.
export const mono = Spline_Sans_Mono({
  variable: "--font-mono-spec",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
