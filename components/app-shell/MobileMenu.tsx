"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconClose } from "@/components/ui/icons";
import { NAV, navIsActive, navTypographyByHref } from "@/components/app-shell/nav";
import { useSwipeDrawer } from "@/components/app-shell/useSwipeDrawer";

type MobileMenuProps = {
  mobileOpen: boolean;
  pathname: string | null;
  onOpen: () => void;
  onClose: () => void;
};

export function MobileMenu({ mobileOpen, pathname, onOpen, onClose }: MobileMenuProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useSwipeDrawer({ isOpen: mobileOpen, onOpen, onClose, drawerRef, overlayRef });

  useEffect(() => {
    if (!mobileOpen) return;

    let closedByPop = false;
    history.pushState({ mobileMenu: true }, "");

    const handlePop = () => {
      closedByPop = true;
      onClose();
    };

    window.addEventListener("popstate", handlePop);

    return () => {
      window.removeEventListener("popstate", handlePop);
      if (!closedByPop) history.back();
    };
  }, [mobileOpen, onClose]);

  return (
    <>
      <div
        ref={overlayRef}
        className={[
          "fixed inset-0 z-20 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ease-[var(--ease-smooth)] md:hidden dark:bg-black/60",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={drawerRef}
        inert={!mobileOpen || undefined}
        aria-hidden={!mobileOpen}
        className={[
          "fixed left-0 top-0 z-30 flex h-dvh w-[min(20rem,88vw)] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] pr-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] shadow-xl md:hidden dark:bg-[var(--surface-muted)]",
          "transition-transform duration-300 ease-[var(--ease-smooth)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="flex-1 text-sm font-semibold tracking-tight">Menu</span>
          <ThemeToggle className="shrink-0" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Menü schließen"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Hauptnavigation">
          {NAV.map((item) => {
            const active = navIsActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center rounded-xl px-3 py-3 text-base transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-900",
                  navTypographyByHref(item.href),
                  active
                    ? "bg-amber-500/16 ring-1 ring-amber-500/30 dark:bg-amber-400/12 dark:ring-amber-400/24"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
                ].join(" ")}
              >
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
  );
}
