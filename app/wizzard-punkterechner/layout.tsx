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
        "relative flex w-full max-w-none min-h-0 flex-1 flex-col overflow-hidden " +
        "-mx-4 -my-4 px-0 sm:-my-6 " +
        "min-h-[calc(100svh-3.5rem)] md:min-h-0"
      }
    >
      {children}
    </div>
  );
}
