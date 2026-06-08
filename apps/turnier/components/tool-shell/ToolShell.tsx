import { cn } from "@/components/ui/styles";

type ToolShellProps = {
  fullBleed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export function ToolShell({ fullBleed = false, className, style, children }: ToolShellProps) {
  return (
    <div
      data-tool="turnier"
      style={style}
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        fullBleed ? "h-full overflow-hidden" : "overflow-y-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
