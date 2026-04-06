"use client";

/** Flex chain so segment roots (e.g. Wizard) can use `flex-1 min-h-0` and fill the main column. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-page-enter flex min-h-0 w-full flex-1 flex-col">
      {children}
    </div>
  );
}
