"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/styles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { navIsFullBleed } from "./nav-config";
import { useFullscreen } from "@/components/FullscreenContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { fullscreen, setFullscreen } = useFullscreen();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isFullBleed = useMemo(() => navIsFullBleed(pathname), [pathname]);

  const shouldShowChrome = useMemo(() => {
    if (!pathname) return true;
    return !pathname.startsWith("/login") && !pathname.startsWith("/register");
  }, [pathname]);

  const handleToggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const handleToggleFullscreen = useCallback(() => setFullscreen(!fullscreen), [setFullscreen, fullscreen]);

  useEffect(() => {
    if (!shouldShowChrome || !fullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen, setFullscreen, shouldShowChrome]);

  if (!shouldShowChrome) {
    return (
      <main className="flex min-h-dvh flex-col bg-[var(--vibe-bg-base)]">
        <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:py-10">
          <div className="mb-6 flex justify-end">
            <ThemeToggle iconOnly />
          </div>
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-dvh min-h-0 w-full min-w-0 flex-row overflow-hidden bg-[var(--vibe-bg-base)] text-[var(--vibe-fg-base)]">
      {/* Desktop Sidebar — nur auf md+ wenn nicht fullscreen */}
      {!fullscreen && <Sidebar pathname={pathname} open={sidebarOpen} />}

      {/* Main area */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Desktop fullscreen exit button — md+ only */}
        {fullscreen && (
          <div className="pointer-events-none absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(0.5rem,env(safe-area-inset-top))] z-40 hidden desk:block">
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className={cn(
                "pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-[var(--vibe-r-md)]",
                "border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)]",
                "text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-soft)]",
                "transition-colors hover:text-[var(--vibe-fg-base)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)]",
              )}
              aria-label="Vollbild verlassen"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Topbar — auf mobile immer versteckt (Vollbild); auf desktop nur ohne fullscreen */}
        {!fullscreen && (
          <div className="hidden desk:block">
            <Topbar
              sidebarOpen={sidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              fullscreen={fullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </div>
        )}

        {/* Content */}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              "flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              isFullBleed
                ? "h-full px-0 py-0"
                : "mx-auto max-w-7xl px-4 py-4 pb-[calc(1rem+64px+env(safe-area-inset-bottom,0px))] sm:py-6 sm:pb-6 desk:pb-6",
            )}
          >
            {children}
          </div>
        </main>

        {/* Mobile/iPad Bottom Nav (desk:hidden in der Komponente — iPad bekommt also auch BottomNav) */}
        <BottomNav pathname={pathname} />
      </div>
    </div>
  );
}
