"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ComponentType } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  IconClose,
  IconHome,
  IconMenu,
  IconSparkles,
} from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

const WIZARD_HREF = "/wizzard-punkterechner";

const NAV: NavItem[] = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: WIZARD_HREF, label: "Wizzard Punkterechner", Icon: IconSparkles },
];

function navIsActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const shouldShowChrome = useMemo(() => {
    if (!pathname) return true;
    return !pathname.startsWith("/login") && !pathname.startsWith("/register");
  }, [pathname]);

  if (!shouldShowChrome) {
    return (
      <main className="flex-1 bg-[var(--background)]">
        <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:py-10">
          <div className="mb-6 flex justify-end">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-dvh min-h-0 w-full min-w-0 flex-row overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Desktop Sidebar */}
      <aside className="relative hidden w-[17.5rem] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] md:flex md:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_28px_-8px_rgba(0,0,0,0.45)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-400/12 to-transparent dark:from-amber-500/10 sidebar-ambient opacity-60"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 px-4 pb-4 pt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/80 p-3 shadow-sm backdrop-blur-md dark:bg-zinc-900/40">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-zinc-950 shadow-md ring-2 ring-amber-400/25 dark:from-amber-300 dark:to-amber-600 dark:ring-amber-300/20">
              V
            </div>
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
              const { Icon } = item;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={{ animationDelay: `${index * 45}ms` }}
                  className={[
                    "nav-item-enter group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "motion-safe:hover:translate-x-0.5",
                    active
                      ? "bg-gradient-to-r from-amber-500/18 to-amber-600/8 text-amber-950 shadow-sm ring-1 ring-amber-500/30 dark:from-amber-400/14 dark:to-amber-600/8 dark:text-amber-50 dark:ring-amber-400/25"
                      : "text-zinc-600 hover:bg-zinc-100/95 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                      active
                        ? "bg-amber-500/25 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100"
                        : "bg-zinc-200/70 text-zinc-600 group-hover:bg-zinc-300/80 dark:bg-zinc-800/90 dark:text-zinc-400 dark:group-hover:bg-zinc-700",
                    ].join(" ")}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
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

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/45 backdrop-blur-[2px] md:hidden dark:bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="fixed left-0 top-0 z-30 flex h-dvh w-[min(20rem,88vw)] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl md:hidden safe-area-inset app-page-enter dark:bg-[var(--surface-muted)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="flex-1 text-sm font-semibold tracking-tight">
                Menu
              </span>
              <ThemeToggle className="shrink-0" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Menü schließen"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Hauptnavigation">
              {NAV.map((item) => {
                const active = navIsActive(pathname, item.href);
                const { Icon } = item;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors duration-200",
                      active
                        ? "bg-amber-500/18 text-amber-950 ring-1 ring-amber-500/30 dark:bg-amber-400/12 dark:text-amber-50 dark:ring-amber-400/22"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-amber-500/25 text-amber-900 dark:bg-amber-400/18 dark:text-amber-100"
                          : "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex-1" />
            <p className="border-t border-[var(--border)] pt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              von Johannes Fahland
            </p>
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="safe-area-inset sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md dark:bg-[var(--surface)]/75">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-3 px-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] transition-colors hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
              aria-label="Menü öffnen"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-zinc-800 transition-colors hover:text-amber-600 dark:text-zinc-100 dark:hover:text-amber-400"
            >
              vibecode projekte
            </Link>
            <div className="hidden flex-1 md:block" />
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const active = navIsActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                      active
                        ? "bg-amber-500/18 text-amber-900 dark:bg-amber-400/12 dark:text-amber-100"
                        : "text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-400",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex-1 md:hidden" />
            <ThemeToggle className="md:ml-2" />
          </div>
        </header>

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
