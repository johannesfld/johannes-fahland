export type NavItem = {
  href: string;
  label: string;
};

export const WIZARD_HREF = "/wizzard-punkterechner";
export const SCHIFFE_HREF = "/schiffe-versenken";

export const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: WIZARD_HREF, label: "Wizzard" },
  { href: "/kniffel-rechner", label: "Kniffel" },
  { href: SCHIFFE_HREF, label: "Schiffe versenken" },
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
  return "font-medium tracking-tight text-zinc-700 dark:text-zinc-200";
}
