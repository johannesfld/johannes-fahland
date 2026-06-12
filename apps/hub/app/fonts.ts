import { Fraunces, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";

// ⚠️ Fraunces ist variable mit axes — KEIN `weight` setzen (sonst Turbopack-Build-Fehler).
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
  preload: true,
});

export const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const splineSansMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
