/**
 * Cancels AppShell main padding so the Wizard can use the full width and, with
 * min-height, the area below the app header (mobile “full screen” content region).
 */
export default function WizzardPunkterechnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "route-scroll-lock relative flex h-full w-full max-w-none min-h-0 flex-1 flex-col overflow-hidden " +
        "my-0 px-0 " +
        "min-h-[calc(100dvh-3.5rem)] min-h-[calc(100svh-3.5rem)]"
      }
    >
      {children}
    </div>
  );
}
