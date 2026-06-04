"use client";

import Link from "next/link";
import { cn } from "@/components/ui/styles";
import { BOTTOM_NAV, navIsActive } from "./nav-config";

type BottomNavProps = {
  pathname: string | null;
};

export function BottomNav({ pathname }: BottomNavProps) {
  const items = BOTTOM_NAV;

  return (
    <nav
      aria-label="Hauptnavigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 md:hidden",
        "border-t border-[var(--vibe-line)]",
        "bg-[var(--vibe-bg-elevated)]/95 backdrop-blur-md",
        "pb-[env(safe-area-inset-bottom,0px)]",
      )}
    >
      <div className="flex items-stretch overflow-x-auto scrollbar-none">
        {items.map((item) => {
          const active = navIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-[4rem] flex-1 flex-col items-center justify-center gap-1 py-2.5 text-center",
                "transition-colors duration-[var(--vibe-dur-1)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--plum-500)]",
                "active:scale-95",
                active
                  ? "text-[var(--plum-500)]"
                  : "text-[var(--vibe-fg-faint)] hover:text-[var(--vibe-fg-muted)]",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full bg-[var(--plum-500)]" />
              )}
              <item.icon
                size={20}
                aria-hidden
                className="transition-transform duration-[var(--vibe-dur-1)] active:scale-90"
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] leading-none">
                {item.labelShort}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
