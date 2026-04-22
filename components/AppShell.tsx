"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { BrandingLogo } from "@/components/BrandingLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconClose, IconMenu } from "@/components/ui/icons";
import { DesktopSidebar } from "@/components/app-shell/DesktopSidebar";
import { MobileMenu } from "@/components/app-shell/MobileMenu";
import { NAV, SCHIFFE_HREF, WIZARD_HREF, navIsActive, navTypographyByHref } from "@/components/app-shell/nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const isFullBleedPage =
    (pathname?.startsWith(WIZARD_HREF) ?? false) ||
    (pathname?.startsWith(SCHIFFE_HREF) ?? false);

  const shouldShowChrome = useMemo(() => {
    if (!pathname) return true;
    return !pathname.startsWith("/login") && !pathname.startsWith("/register");
  }, [pathname]);

  const handleMobileOpen = useCallback(() => setMobileOpen(true), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

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
      <DesktopSidebar
        pathname={pathname}
        desktopSidebarOpen={desktopSidebarOpen}
      />
      <MobileMenu
        mobileOpen={mobileOpen}
        pathname={pathname}
        onOpen={handleMobileOpen}
        onClose={handleMobileClose}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="safe-area-inset sticky top-0 z-40 flex min-h-14 shrink-0 items-center border-b border-[var(--border)] bg-zinc-50/95 pt-[max(env(safe-area-inset-top),0.4rem)] backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-800/85">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-3 px-4">
            <button
              type="button"
              onClick={mobileOpen ? handleMobileClose : handleMobileOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] transition duration-200 hover:bg-zinc-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 md:hidden dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
              aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
            >
              {mobileOpen ? (
                <IconClose className="h-5 w-5" />
              ) : (
                <IconMenu className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen((prev) => !prev)}
              className="hidden h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] transition duration-200 hover:bg-zinc-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 md:inline-flex dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
              aria-label={
                desktopSidebarOpen ? "Sidebar einklappen" : "Sidebar ausklappen"
              }
            >
              {desktopSidebarOpen ? (
                <IconClose className="h-5 w-5" />
              ) : (
                <IconMenu className="h-5 w-5" />
              )}
            </button>
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-zinc-800 transition-colors hover:text-amber-600 dark:text-zinc-100 dark:hover:text-amber-400"
            >
              <BrandingLogo className="!h-9 !w-9" />
              <span className="truncate max-[360px]:hidden standalone-compact-title">vibecode projekte</span>
            </Link>
            <div className="hidden flex-1 md:block" />
            {!desktopSidebarOpen && (
              <nav className="hidden items-center gap-1 md:flex">
                {NAV.map((item) => {
                  const active = navIsActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "rounded-lg px-3 py-2 text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
                        navTypographyByHref(item.href),
                        active
                          ? "bg-amber-500/16 ring-1 ring-amber-500/25 dark:bg-amber-400/12 dark:ring-amber-400/20"
                          : "hover:text-amber-600 dark:hover:text-amber-300",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
            <div className="flex-1 md:hidden" />
            <ThemeToggle className="md:ml-2" />
          </div>
        </header>

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className={[
              "flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              isFullBleedPage
                ? "h-full min-h-0 px-0 py-0"
                : "mx-auto max-w-7xl px-4 py-4 sm:py-6",
            ].join(" ")}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
