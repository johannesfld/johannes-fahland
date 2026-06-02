import { cn } from "@/components/ui/styles";

type Tool = "wizard" | "kniffel" | "schiffe" | "romme" | "turnier" | "g2048" | "snake";

type ToolShellProps = {
  tool: Tool;
  fullBleed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export function ToolShell({ tool, fullBleed = false, className, style, children }: ToolShellProps) {
  return (
    <div
      data-tool={tool}
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
