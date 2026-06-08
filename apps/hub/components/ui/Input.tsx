"use client";

import { forwardRef } from "react";
import { cn, inputBase } from "./styles";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputBase, className)} {...props} />
  ),
);
Input.displayName = "Input";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(inputBase, "cursor-pointer pr-8 appearance-none", className)}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

type NumberStepperProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

export function NumberStepper({ value, onChange, min, max, className }: NumberStepperProps) {
  const dec = () => onChange(min !== undefined ? Math.max(min, value - 1) : value - 1);
  const inc = () => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1);

  return (
    <div className={cn("flex items-center rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line-strong)] bg-[var(--vibe-bg-elevated)] overflow-hidden", className)}>
      <button
        type="button"
        onClick={dec}
        className="flex h-14 w-14 shrink-0 items-center justify-center text-xl font-medium text-[var(--vibe-fg-muted)] hover:bg-[var(--vibe-bg-sunken)] hover:text-[var(--accent)] transition-colors active:scale-95"
        aria-label="Verringern"
      >
        −
      </button>
      <span className="flex-1 text-center font-mono text-2xl font-semibold tabular-nums tracking-tight text-[var(--vibe-fg-base)]">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        className="flex h-14 w-14 shrink-0 items-center justify-center text-xl font-medium text-[var(--vibe-fg-muted)] hover:bg-[var(--vibe-bg-sunken)] hover:text-[var(--accent)] transition-colors active:scale-95"
        aria-label="Erhöhen"
      >
        +
      </button>
    </div>
  );
}
