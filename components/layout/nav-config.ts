import { Home, Sparkles, Dices, Ship, SquareStack, Trophy, Grid3x3, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  labelShort: string;
  icon: LucideIcon;
  tool: string | null;
  /** Show in mobile bottom-nav. Skip for less-frequent tools to avoid overflow. */
  bottomNav?: boolean;
};

export const WIZARD_HREF = "/wizzard-punkterechner";
export const SCHIFFE_HREF = "/schiffe-versenken";
export const TURNIER_HREF = "/tischtennis-turnier";
export const ROMME_HREF = "/romme";
export const G2048_HREF = "/2048";

export const NAV: NavItem[] = [
  { href: "/",              label: "Home",            labelShort: "Home",    icon: Home,        tool: null,      bottomNav: true },
  { href: WIZARD_HREF,      label: "Wizard",          labelShort: "Wizard",  icon: Sparkles,    tool: "wizard",  bottomNav: true },
  { href: "/kniffel-rechner", label: "Kniffel",       labelShort: "Kniffel", icon: Dices,       tool: "kniffel", bottomNav: true },
  { href: SCHIFFE_HREF,     label: "Schiffe versenken", labelShort: "Schiffe", icon: Ship,      tool: "schiffe", bottomNav: true },
  { href: ROMME_HREF,       label: "Rommé",           labelShort: "Rommé",   icon: SquareStack, tool: "romme",   bottomNav: true },
  { href: TURNIER_HREF,     label: "Turniertool",     labelShort: "Turnier", icon: Trophy,      tool: "turnier", bottomNav: true },
  { href: G2048_HREF,       label: "2048",            labelShort: "2048",    icon: Grid3x3,     tool: "g2048",   bottomNav: false },
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
    pathname.startsWith(TURNIER_HREF) ||
    pathname.startsWith(G2048_HREF)
  );
}
