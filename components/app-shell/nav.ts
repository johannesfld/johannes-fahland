import { Home, Sparkles, Dices, Ship, Trophy, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const WIZARD_HREF = "/wizzard-punkterechner";
export const SCHIFFE_HREF = "/schiffe-versenken";
export const TURNIER_HREF = "/tischtennis-turnier";

export const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: WIZARD_HREF, label: "Wizzard", icon: Sparkles },
  { href: "/kniffel-rechner", label: "Kniffel", icon: Dices },
  { href: SCHIFFE_HREF, label: "Schiffe versenken", icon: Ship },
  { href: TURNIER_HREF, label: "Turniertool", icon: Trophy },
];

export function navIsActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navTypographyByHref(href: string) {
  if (href === WIZARD_HREF) {
    return "font-serif font-black tracking-tight text-zinc-700 dark:text-zinc-200";
  }
  if (href === "/kniffel-rechner") {
    return "font-sans italic font-black tracking-tight text-zinc-700 dark:text-zinc-200";
  }
  if (href === SCHIFFE_HREF) {
    return "font-sans font-black tracking-tight text-slate-800 text-zinc-700 dark:text-zinc-200";
  }
  if (href === TURNIER_HREF) {
    return "font-sans font-black tracking-tight text-amber-700 dark:text-amber-300";
  }
  return "font-medium tracking-tight text-zinc-700 dark:text-zinc-200";
}
