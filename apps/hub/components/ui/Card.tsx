import { forwardRef } from "react";
import { cn, cardBase, cardInteractive, cardElevated } from "./styles";

type CardVariant = "default" | "interactive" | "elevated";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  default: cardBase,
  interactive: cardInteractive,
  elevated: cardElevated,
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = "Card";
