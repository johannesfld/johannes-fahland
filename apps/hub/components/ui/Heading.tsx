import { cn } from "./styles";

type HeadingVariant = "display" | "h1" | "h2" | "h3";
type HeadingFont = "sans" | "mono" | "display" | "hand";

const variantClasses: Record<HeadingVariant, string> = {
  display: "text-[2rem] leading-tight font-bold tracking-[-0.02em]",
  h1:      "text-2xl leading-[1.2] font-semibold tracking-[-0.01em]",
  h2:      "text-lg leading-snug font-semibold tracking-[-0.005em]",
  h3:      "text-[0.9375rem] leading-snug font-semibold",
};

const fontClasses: Record<HeadingFont, string> = {
  sans:    "font-sans",
  mono:    "font-mono",
  display: "font-display",
  hand:    "font-hand",
};

type HeadingProps = {
  variant?: HeadingVariant;
  font?: HeadingFont;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
  className?: string;
  children: React.ReactNode;
};

export function Heading({ variant = "h2", font = "sans", as, className, children }: HeadingProps) {
  const Tag = as ?? (variant === "display" ? "h1" : variant === "h3" ? "h3" : variant) as "h1" | "h2" | "h3";
  return (
    <Tag className={cn(variantClasses[variant], fontClasses[font], "text-[var(--vibe-fg-base)]", className)}>
      {children}
    </Tag>
  );
}
