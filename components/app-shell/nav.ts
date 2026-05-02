import { rommeDisplay } from "@/components/romme/romme-display-font";
import { Home, Sparkles, Dices, Ship, SquareStack, Trophy, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const WIZARD_HREF = "/wizzard-punkterechner";
export const SCHIFFE_HREF = "/schiffe-versenken";
export const TURNIER_HREF = "/tischtennis-turnier";
export const ROMME_HREF = "/romme";

export const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: WIZARD_HREF, label: "Wizard", icon: Sparkles },
  { href: "/kniffel-rechner", label: "Kniffel", icon: Dices },
  { href: SCHIFFE_HREF, label: "Schiffe versenken", icon: Ship },
  { href: ROMME_HREF, label: "Rommé", icon: SquareStack },
  { href: TURNIER_HREF, label: "Turniertool", icon: Trophy },
];

export function navIsActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navTextUnified = "text-zinc-900 dark:text-white";

export function navTypographyByHref(href: string) {
  if (href === WIZARD_HREF) {
    return `font-serif font-black tracking-tight ${navTextUnified}`;
  }
  if (href === "/kniffel-rechner") {
    return `font-sans italic font-black tracking-tight ${navTextUnified}`;
  }
  if (href === SCHIFFE_HREF) {
    return `font-sans font-black tracking-tight ${navTextUnified}`;
  }
  if (href === ROMME_HREF) {
    return `${rommeDisplay.className} text-xs font-semibold uppercase tracking-wide ${navTextUnified}`;
  }
  if (href === TURNIER_HREF) {
    return `font-mono font-black tracking-[0.08em] ${navTextUnified}`;
  }
  return `font-medium tracking-tight ${navTextUnified}`;
}

/** Hintergrund + Ring für aktiven Nav-Eintrag (Sidebar / Drawer / Header). */
export function navActiveClassesByHref(_href: string): string {
  return "bg-zinc-200/90 ring-1 ring-zinc-300 dark:bg-white/10 dark:ring-white/20";
}

/** Inaktiver Eintrag: Zeilenhintergrund (Sidebar, Mobile). */
export function navInactiveRowClassesByHref(_href: string): string {
  return "hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-white";
}

/** Inaktiver Eintrag: nur Text-Hover (kompakte Header-Leiste). */
export function navHeaderInactiveHoverByHref(_href: string): string {
  return "hover:text-zinc-950 dark:hover:text-white";
}
