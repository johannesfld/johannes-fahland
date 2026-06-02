import { cn } from "./styles";

type SectionProps = {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function Section({ title, description, className, children }: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {(title || description) && (
        <div className="flex flex-col gap-0.5">
          {title && (
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-[var(--vibe-fg-muted)]">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
