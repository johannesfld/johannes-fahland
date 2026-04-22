"use client";

import Link from "next/link";
import { BrandingLogo } from "@/components/BrandingLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NAV, navIsActive, navTypographyByHref } from "@/components/app-shell/nav";

type DesktopSidebarProps = {
  pathname: string | null;
  desktopSidebarOpen: boolean;
};

export function DesktopSidebar({
  pathname,
  desktopSidebarOpen,
}: DesktopSidebarProps) {
  return (
    <aside
      className={[
        "relative hidden h-dvh w-[17.5rem] shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-gradient-to-b from-zinc-50 to-[var(--surface)] md:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)] dark:from-zinc-800 dark:to-[var(--surface)] dark:shadow-[4px_0_28px_-8px_rgba(0,0,0,0.45)]",
        desktopSidebarOpen ? "md:flex" : "md:hidden",
      ].join(" ")}
    >
      <div className="relative flex h-full flex-col gap-5 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-zinc-50/95 p-3 shadow-sm backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-800/85">
          <BrandingLogo />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight">
              vibecode projekte
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              v1.0
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-zinc-300/70 to-transparent dark:via-zinc-600/40" />

        <nav className="flex flex-col gap-1" aria-label="Hauptnavigation">
          {NAV.map((item, index) => {
            const active = navIsActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                style={{ animationDelay: `${index * 45}ms` }}
                className={[
                  "nav-item-enter group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-900",
                  "motion-safe:hover:translate-x-0.5",
                  navTypographyByHref(item.href),
                  active
                    ? "bg-amber-500/16 ring-1 ring-amber-500/30 dark:bg-amber-400/12 dark:ring-amber-400/24"
                    : "text-zinc-600 hover:bg-zinc-100/95 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white",
                ].join(" ")}
              >
                <item.icon size={18} className="shrink-0 opacity-60" aria-hidden />
                <span className="min-w-0 leading-snug">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex flex-col gap-2">
          <ThemeToggle className="w-full justify-center" />
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 py-3 text-center dark:bg-zinc-900/35">
            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              von{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Johannes Fahland
              </span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
