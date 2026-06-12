"use client";

import Link from "next/link";
import { cn } from "@/components/ui/styles";
import { VibeLogo, VibeWordmark } from "./VibeLogo";
import { NAV, navIsActive } from "./nav-config";
import { ThemeToggle } from "@/components/ThemeToggle";

type SidebarProps = {
  pathname: string | null;
  open: boolean;
};

export function Sidebar({ pathname, open }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative hidden h-dvh w-[240px] shrink-0 flex-col overflow-hidden",
        "border-r border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]",
        "shadow-[1px_0_0_0_var(--vibe-line)]",
        open ? "desk:flex" : "desk:hidden",
      )}
    >
      <div className="flex h-full flex-col gap-4 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pt-5">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--vibe-r-md)] bg-[var(--brand-50)] dark:bg-[var(--brand-950)] text-[var(--brand-500)]">
            <VibeLogo size={22} />
          </div>
          <div className="min-w-0">
            <VibeWordmark />
            <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--vibe-fg-faint)]">
              Der digitale Spieleabend
            </p>
          </div>
        </div>

        <div className="h-px bg-[var(--vibe-line)]" />

        {/* Nav */}
        <nav className="flex flex-col gap-0.5" aria-label="Hauptnavigation">
          {NAV.map((item, index) => {
            const active = navIsActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                style={{ animationDelay: `${index * 45}ms` }}
                className={cn(
                  "nav-item-enter group relative flex items-center gap-2.5 rounded-[var(--vibe-r-md)] px-3 py-2.5 text-sm transition-all duration-[var(--vibe-dur-1)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1",
                  "motion-safe:hover:translate-x-0.5",
                  active
                    ? "bg-[var(--vibe-bg-tinted)] text-[var(--vibe-fg-base)] font-semibold"
                    : "text-[var(--vibe-fg-muted)] hover:bg-[var(--vibe-bg-sunken)] hover:text-[var(--vibe-fg-base)]",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--brand-500)]" />
                )}
                <item.icon
                  size={17}
                  className={cn(
                    "shrink-0 transition-colors",
                    active ? "text-[var(--brand-500)]" : "opacity-50",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 leading-snug font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Footer */}
        <div className="flex flex-col gap-1.5 rounded-[var(--vibe-r-md)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)]/50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-[var(--vibe-fg-faint)]">
              von <span className="font-medium text-[var(--vibe-fg-muted)]">Johannes Fahland</span>
            </p>
            <ThemeToggle iconOnly />
          </div>
          <Link
            href="/impressum"
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)] transition-colors hover:text-[var(--vibe-fg-muted)]"
          >
            Impressum
          </Link>
        </div>
      </div>
    </aside>
  );
}
