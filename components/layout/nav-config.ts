import { Home, Sparkles, Dices, Ship, SquareStack, Trophy, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  labelShort: string;
  icon: LucideIcon;
  tool: string | null;
};

export const WIZARD_HREF = "/wizzard-punkterechner";
export const SCHIFFE_HREF = "/schiffe-versenken";
export const TURNIER_HREF = "/tischtennis-turnier";
export const ROMME_HREF = "/romme";

export const NAV: NavItem[] = [
  { href: "/",              label: "Home",            labelShort: "Home",    icon: Home,        tool: null },
  { href: WIZARD_HREF,      label: "Wizard",          labelShort: "Wizard",  icon: Sparkles,    tool: "wizard" },
  { href: "/kniffel-rechner", label: "Kniffel",       labelShort: "Kniffel", icon: Dices,       tool: "kniffel" },
  { href: SCHIFFE_HREF,     label: "Schiffe versenken", labelShort: "Schiffe", icon: Ship,      tool: "schiffe" },
  { href: ROMME_HREF,       label: "Rommé",           labelShort: "Rommé",   icon: SquareStack, tool: "romme" },
  { href: TURNIER_HREF,     label: "Turniertool",     labelShort: "Turnier", icon: Trophy,      tool: "turnier" },
];

export function navIsActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navIsFullBleed(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith(WIZARD_HREF) ||
    pathname.startsWith(SCHIFFE_HREF) ||
    pathname.startsWith(TURNIER_HREF)
  );
}
