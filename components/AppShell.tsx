"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/wizzard-punkterechner", label: "Wizzard Punkterechner" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const shouldShowChrome = useMemo(() => {
    if (!pathname) return true;
    return !pathname.startsWith("/login") && !pathname.startsWith("/register");
  }, [pathname]);

  if (!shouldShowChrome) {
    return (
      <main className="flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:py-10">
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col md:flex-row bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-4 py-6 dark:border-zinc-800 dark:bg-gradient-to-b dark:from-zinc-950 dark:to-black">
        <div className="flex flex-col items-center gap-3 px-2 pb-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg" />
          <div className="text-center">
            <h1 className="text-sm font-bold tracking-tight">
              vibecode projekte
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">v1.0</p>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800 mb-4" />
        <nav className="flex flex-col gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-200 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 hover:translate-x-1 hover:shadow-md"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            von Johannes Fahland
          </p>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          {/* Mobile Menu */}
          <div className="fixed left-0 top-0 z-30 h-dvh w-72 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:hidden overflow-y-auto flex flex-col safe-area-inset">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-sm font-semibold tracking-tight flex-1">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 transition-all duration-200 hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800 flex-shrink-0"
                aria-label="Close menu"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-all duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex-1" />
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                von Johannes Fahland
              </p>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 flex-shrink-0 safe-area-inset">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 md:hidden transition-all duration-200 hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
              aria-label="Open menu"
            >
              <span className="text-xl leading-none">≡</span>
            </button>
            <Link href="/" className="text-sm font-semibold tracking-tight hover:text-amber-600 transition-colors duration-200">
              vibecode projekte
            </Link>
            <div className="flex-1" />
            <nav className="hidden md:flex items-center gap-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-zinc-700 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-400 transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
