"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/components/ui/styles";
import { VibeLogo, VibeWordmark } from "./VibeLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconMenu, IconClose } from "@/components/ui/icons";

type TopbarProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  showMobileMenuToggle?: boolean;
};

export function Topbar({
  sidebarOpen,
  onToggleSidebar,
  fullscreen,
  onToggleFullscreen,
}: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex min-h-14 shrink-0 items-center",
        "border-b border-[var(--vibe-line)]",
        "bg-[var(--vibe-bg-base)]/95 backdrop-blur-md",
        "pt-[max(env(safe-area-inset-top,0px),0.4rem)]",
        "pr-[env(safe-area-inset-right,0px)] pl-[env(safe-area-inset-left,0px)]",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        {/* Sidebar/Menu toggle — desktop only */}
        <motion.button
          type="button"
          onClick={onToggleSidebar}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "hidden h-9 w-9 items-center justify-center rounded-[var(--vibe-r-md)]",
            "border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)]",
            "text-[var(--vibe-fg-muted)] transition-colors hover:text-[var(--vibe-fg-base)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] focus-visible:ring-offset-1",
            "desk:inline-flex",
          )}
          aria-label={sidebarOpen ? "Sidebar einklappen" : "Sidebar ausklappen"}
        >
          {sidebarOpen ? <IconClose className="h-4 w-4" /> : <IconMenu className="h-4 w-4" />}
        </motion.button>

        {/* Brand */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-[var(--vibe-r-sm)] px-1 py-1",
            "text-[var(--vibe-fg-base)] transition-opacity hover:opacity-80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)]",
            sidebarOpen ? "desk:opacity-0 desk:pointer-events-none" : "",
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--vibe-r-sm)] bg-[var(--brand-50)] dark:bg-[var(--brand-950)] text-[var(--brand-500)]">
            <VibeLogo size={16} />
          </div>
          <VibeWordmark className="hidden sm:block" />
        </Link>

        <div className="flex-1" />

        {/* Fullscreen toggle — desktop only (mobile ist immer fullscreen) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={onToggleFullscreen}
          className={cn(
            "hidden h-9 w-9 items-center justify-center rounded-[var(--vibe-r-md)]",
            "border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)]",
            "text-[var(--vibe-fg-muted)] transition-colors hover:text-[var(--vibe-fg-base)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] focus-visible:ring-offset-1",
            "desk:inline-flex",
          )}
          aria-label={fullscreen ? "Vollbild verlassen" : "Vollbild"}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
        </motion.button>

        {/* Theme toggle — Symbol, ganz rechts */}
        <ThemeToggle iconOnly />
      </div>
    </header>
  );
}
