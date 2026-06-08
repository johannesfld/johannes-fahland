import { cn, microLabel } from "./styles";

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, eyebrow, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex min-w-0 items-start gap-4", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {eyebrow && <p className={microLabel}>{eyebrow}</p>}
        <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--vibe-fg-base)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--vibe-fg-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
