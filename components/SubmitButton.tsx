"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          {pendingText ?? "Working..."}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
