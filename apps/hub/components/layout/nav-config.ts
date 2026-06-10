import { Home, Sparkles, Dices, Ship, SquareStack, Grid3x3, Zap, Brain, Type, type LucideIcon } from "lucide-react";

/**
 * Liste aller Tool-Slugs des Hub — Quelle für `ToolShell.tool` und `[data-tool=...]` in globals.css.
 */
export const TOOL_SLUGS = [
  "wizard",
  "kniffel",
  "schiffe",
  "romme",
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
  group?: "main" | "solo" | "multiplayer";
};

export const WIZARD_HREF = "/wizzard-punkterechner";
export const SCHIFFE_HREF = "/schiffe-versenken";
export const ROMME_HREF = "/romme";
export const G2048_HREF = "/2048";
export const SNAKE_HREF = "/snake";
export const MEMORY_HREF = "/memory";
export const WORDLE_HREF = "/wordle";

/** Sidebar order: Home, dann Solo-Spiele, dann Multiplayer-Spiele */
export const NAV: NavItem[] = [
  { href: "/",               label: "Home",              labelShort: "Home",    icon: Home,        tool: null,      group: "main"        },
  { href: G2048_HREF,        label: "2048",              labelShort: "2048",    icon: Grid3x3,     tool: "g2048",   group: "solo"        },
  { href: SNAKE_HREF,        label: "Snake",             labelShort: "Snake",   icon: Zap,         tool: "snake",   group: "solo"        },
  { href: WORDLE_HREF,       label: "Wordle",            labelShort: "Wordle",  icon: Type,        tool: "wordle",  group: "solo"        },
  { href: MEMORY_HREF,       label: "Memory",            labelShort: "Memory",  icon: Brain,       tool: "memory",  group: "solo"        },
  { href: WIZARD_HREF,       label: "Wizard",            labelShort: "Wizard",  icon: Sparkles,    tool: "wizard",  group: "multiplayer" },
  { href: "/kniffel-rechner",label: "Kniffel",           labelShort: "Kniffel", icon: Dices,       tool: "kniffel", group: "multiplayer" },
  { href: SCHIFFE_HREF,      label: "Schiffe versenken", labelShort: "Schiffe", icon: Ship,        tool: "schiffe", group: "multiplayer" },
  { href: ROMME_HREF,        label: "Rommé",             labelShort: "Rommé",   icon: SquareStack, tool: "romme",   group: "multiplayer" },
];

/** Bottom-nav: Home + alle Spiele in derselben Reihenfolge wie die Sidebar */
export const BOTTOM_NAV: NavItem[] = NAV;

export function navIsActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  // External hrefs sind nie "active" innerhalb der Hub-App.
  if (href.startsWith("http")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navIsFullBleed(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith(WIZARD_HREF) ||
    pathname.startsWith(SCHIFFE_HREF) ||
    pathname.startsWith(G2048_HREF) ||
    pathname.startsWith(SNAKE_HREF)
  );
}
