import { Newsreader, Public_Sans, Spline_Sans_Mono } from "next/font/google";

// Editorial Serif — nur für Headlines. Variabel (opsz), kein fixes `weight`.
export const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  preload: true,
});

// Ruhige Grotesk — UI & Body.
export const grotesk = Public_Sans({
  variable: "--font-grotesk",
  subsets: ["latin"],
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
