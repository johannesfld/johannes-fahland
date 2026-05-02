import { Oswald } from "next/font/google";

/** Einheitlich für Home-Tile, Nav-Label und Seitenüberschrift Rommé. */
export const rommeDisplay = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-romme-display",
});
