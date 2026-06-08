import { cn } from "@/components/ui/styles";
import type { PlayerScores } from "@/components/kniffel/constants";

type SumRowProps = {
  label: string;
  players: PlayerScores[];
  calc: (s: PlayerScores) => number;
  highlight?: boolean;
  large?: boolean;
};

export function SumRow({ label, players, calc, highlight, large }: SumRowProps) {
  return (
    <tr
      className={cn(
        "border-y border-[var(--vibe-line-strong)]",
        highlight
          ? "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
          : "bg-[var(--vibe-bg-sunken)]",
      )}
    >
      <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)] border-r border-[var(--vibe-line)]">
        {label}
      </td>
      {players.map((s, i) => (
        <td
          key={i}
          className={cn(
            "px-4 py-2.5 text-center font-mono font-bold tabular-nums",
            large
              ? "text-xl text-[var(--accent)]"
              : "text-sm text-[var(--vibe-fg-muted)]",
          )}
        >
          {calc(s)}
        </td>
      ))}
    </tr>
  );
}
