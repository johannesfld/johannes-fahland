import { cn } from "./styles";

type StackProps = {
  direction?: "vertical" | "horizontal";
  gap?: 1 | 2 | 3 | 4 | 5;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
};

const gapClasses = { 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 5: "gap-6" } as const;
const alignClasses = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" } as const;
const justifyClasses = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" } as const;

export function Stack({
  direction = "vertical",
  gap = 3,
  align = "stretch",
  justify = "start",
  wrap = false,
  className,
  children,
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "horizontal" ? "flex-row" : "flex-col",
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && "flex-wrap",
        className,
      )}
    >
      {children}
    </div>
  );
}
