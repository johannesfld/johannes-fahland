"use client";

import { cn } from "./styles";

type Tab = {
  key: string;
  label: string;
};

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
};

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex border-b border-[var(--vibe-line)]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--vibe-dur-1)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1",
              isActive
                ? "text-[var(--vibe-fg-base)]"
                : "text-[var(--vibe-fg-muted)] hover:text-[var(--vibe-fg-base)]",
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[var(--accent)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
