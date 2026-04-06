/**
 * Segment wrapper: full width of the content column, negative margin cancels AppShell padding
 * so the Wizard gradient can be edge-to-edge horizontally. Height comes from flex + min-height
 * inside WizardScoreMaster (avoid `absolute` roots that collapse parent height on mobile).
 */
export default function WizzardPunkterechnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex w-full max-w-none min-h-0 flex-1 flex-col overflow-hidden -mx-4 -my-4 sm:-my-6">
      {children}
    </div>
  );
}
