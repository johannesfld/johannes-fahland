"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Logo } from "@pasch/ui";
import { cn } from "@/components/ui/styles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BOTTOM_NAV, navIsActive } from "./nav-config";

type BottomNavProps = {
  pathname: string | null;
};

export function BottomNav({ pathname }: BottomNavProps) {
  const items = BOTTOM_NAV;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Aktives Item beim Routenwechsel in den sichtbaren Bereich scrollen
  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;
    const sRect = scroller.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const target = active.offsetLeft - (scroller.clientWidth - active.clientWidth) / 2;
    if (aRect.left < sRect.left || aRect.right > sRect.right) {
      scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  }, [pathname]);

  return (
    <nav
      aria-label="Hauptnavigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 desk:hidden",
        "border-t border-[var(--vibe-line)]",
        // Voll deckende Fläche bis zum physischen Rand — kein durchscheinender
        // Filz, kein Schatten. Die safe-area unten gehört zur Nav-Fläche.
        "bg-[var(--vibe-bg-elevated)]",
        "pb-[env(safe-area-inset-bottom,0px)]",
      )}
    >
      <div className="flex items-stretch gap-1 px-1.5">
        {/* Fester Marken-/Home-Button ganz links */}
        <Link
          ref={navIsActive(pathname, "/") ? activeRef : undefined}
          href="/"
          aria-current={navIsActive(pathname, "/") ? "page" : undefined}
          aria-label="Home"
          className={cn(
            "relative flex shrink-0 items-center justify-center",
            "my-1.5 h-11 w-11 rounded-[var(--vibe-r-md)]",
            "transition-all duration-[var(--vibe-dur-1)] active:scale-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)]",
            navIsActive(pathname, "/")
              ? "bg-[var(--brand-500)] text-[var(--brand-50)] shadow-[var(--vibe-shadow-soft)]"
              : "text-[var(--brand-500)] bg-[var(--vibe-bg-sunken)] hover:bg-[var(--vibe-bg-tinted)]",
          )}
        >
          <Logo size={22} />
        </Link>

        {/* Scrollbare Spiele-Items */}
        <div className="relative min-w-0 flex-1">
          <div
            ref={scrollerRef}
            className="flex items-stretch overflow-x-auto scrollbar-none snap-x snap-mandatory px-1"
            style={{ scrollPaddingInline: "1rem" }}
          >
            {items
              .filter((item) => item.href !== "/")
              .map((item) => {
                const active = navIsActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    ref={active ? activeRef : undefined}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex shrink-0 snap-center flex-col items-center justify-center gap-1 py-2.5 text-center",
                      "w-[4.25rem]",
                      "transition-colors duration-[var(--vibe-dur-1)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-500)]",
                      "active:scale-95",
                      // Minimalistisch: Marken-Pink für aktiv, keine Tool-Akzentfarben.
                      active
                        ? "text-[var(--brand-500)]"
                        : "text-[var(--vibe-fg-faint)] hover:text-[var(--vibe-fg-muted)]",
                    )}
                  >
                    {active && (
                      <span className="absolute -top-px left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-b-full bg-[var(--brand-500)]" />
                    )}
                    <item.icon
                      size={20}
                      aria-hidden
                      className="transition-transform duration-[var(--vibe-dur-1)] active:scale-90"
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.06em] leading-none">
                      {item.labelShort}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Fester Theme-Toggle ganz rechts */}
        <div className="flex shrink-0 items-center border-l border-[var(--vibe-line)] pl-1.5">
          <ThemeToggle iconOnly />
        </div>
      </div>
    </nav>
  );
}
