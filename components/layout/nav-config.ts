import { Home, Sparkles, Dices, Ship, SquareStack, Trophy, Grid3x3, Zap, Brain, Type, type LucideIcon } from "lucide-react";

/**
 * Liste aller Tool-Slugs — Quelle für `ToolShell.tool` und `[data-tool=...]` in globals.css.
 * Neues Spiel hinzufügen: hier den Slug + entsprechendes NAV-Item ergänzen.
 */
export const TOOL_SLUGS = [
  "wizard",
  "kniffel",
  "schiffe",
  "romme",
  "turnier",
  "g2048",
  "snake",
  "memory",
  "wordle",
] as const;

export type ToolSlug = (typeof TOOL_SLUGS)[number];

export type NavItem = {
  href: string;
  label: string;
  labelShort: string;
  icon: LucideIcon;
  tool: ToolSlug | null;
  /** Show in mobile bottom-nav */
  bottomNav?: boolean;
  group?: "main" | "games" | "tools";
};

export const WIZARD_HREF = "/wizzard-punkterechner";
export const SCHIFFE_HREF = "/schiffe-versenken";
export const TURNIER_HREF = "/tischtennis-turnier";
export const ROMME_HREF = "/romme";
export const G2048_HREF = "/2048";
export const SNAKE_HREF = "/snake";
export const MEMORY_HREF = "/memory";
export const WORDLE_HREF = "/wordle";

/** Sidebar order: tools first, then games */
export const NAV: NavItem[] = [
  { href: "/",               label: "Home",              labelShort: "Home",    icon: Home,        tool: null,      group: "main"  },
  { href: WIZARD_HREF,       label: "Wizard",            labelShort: "Wizard",  icon: Sparkles,    tool: "wizard",  group: "tools" },
  { href: "/kniffel-rechner",label: "Kniffel",           labelShort: "Kniffel", icon: Dices,       tool: "kniffel", group: "tools" },
  { href: SCHIFFE_HREF,      label: "Schiffe versenken", labelShort: "Schiffe", icon: Ship,        tool: "schiffe", group: "tools" },
  { href: ROMME_HREF,        label: "Rommé",             labelShort: "Rommé",   icon: SquareStack, tool: "romme",   group: "tools" },
  { href: TURNIER_HREF,      label: "Turniertool",       labelShort: "Turnier", icon: Trophy,      tool: "turnier", group: "tools" },
  { href: G2048_HREF,        label: "2048",              labelShort: "2048",    icon: Grid3x3,     tool: "g2048",   group: "games" },
  { href: SNAKE_HREF,        label: "Snake",             labelShort: "Snake",   icon: Zap,         tool: "snake",   group: "games" },
  { href: MEMORY_HREF,       label: "Memory",            labelShort: "Memory",  icon: Brain,       tool: "memory",  group: "games" },
  { href: WORDLE_HREF,       label: "Wordle",            labelShort: "Wordle",  icon: Type,        tool: "wordle",  group: "games" },
];

/** Bottom-nav: Home + alle Spiele + alle Tools (horizontal scrollbar mit Snap) */
export const BOTTOM_NAV: NavItem[] = [
  NAV.find((i) => i.href === "/")!,
  // Spiele zuerst (häufiger genutzt auf Mobile)
  NAV.find((i) => i.href === G2048_HREF)!,
  NAV.find((i) => i.href === SNAKE_HREF)!,
  NAV.find((i) => i.href === MEMORY_HREF)!,
  NAV.find((i) => i.href === WORDLE_HREF)!,
  // Tools danach
  NAV.find((i) => i.href === WIZARD_HREF)!,
  NAV.find((i) => i.href === "/kniffel-rechner")!,
  NAV.find((i) => i.href === SCHIFFE_HREF)!,
  NAV.find((i) => i.href === ROMME_HREF)!,
  NAV.find((i) => i.href === TURNIER_HREF)!,
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
    pathname.startsWith(G2048_HREF) ||
    pathname.startsWith(SNAKE_HREF)
  );
}
