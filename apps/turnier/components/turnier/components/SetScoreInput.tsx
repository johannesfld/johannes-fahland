import { Minus, Plus } from "lucide-react";
import { stepperBtn } from "@/components/turnier/styles";

type SetScoreInputProps = {
  setNumber: number;
  scoreTeam1?: number;
  scoreTeam2?: number;
  disabled?: boolean;
  onChange: (team: 1 | 2, value: string) => void;
};

const MAX_SCORE = 99;

function TeamStepper({
  team,
  value,
  disabled,
  ariaLabel,
  onChange,
}: {
  team: 1 | 2;
  value?: number;
  disabled: boolean;
  ariaLabel: string;
  onChange: (team: 1 | 2, value: string) => void;
}) {
  const current = typeof value === "number" ? value : null;
  const dec = () => {
    const base = current ?? 0;
    onChange(team, String(Math.max(0, base - 1)));
  };
  const inc = () => {
    const base = current ?? -1; // erstes + erzeugt 0
    onChange(team, String(Math.min(MAX_SCORE, base + 1)));
  };

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        className={stepperBtn}
        disabled={disabled || (current ?? 0) <= 0}
        onClick={dec}
        aria-label={`${ariaLabel} verringern`}
        tabIndex={-1}
      >
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_SCORE}
        value={value ?? ""}
        onChange={(event) => onChange(team, event.target.value)}
        placeholder="0"
        disabled={disabled}
        aria-label={ariaLabel}
        className="h-12 w-12 min-w-0 rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-1 text-center font-mono text-xl font-bold text-[var(--vibe-fg-base)] shadow-[var(--vibe-shadow-flat)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 disabled:opacity-40 disabled:pointer-events-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={stepperBtn}
        disabled={disabled || (current ?? 0) >= MAX_SCORE}
        onClick={inc}
        aria-label={`${ariaLabel} erhöhen`}
        tabIndex={-1}
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}

export function SetScoreInput({
  setNumber,
  scoreTeam1,
  scoreTeam2,
  disabled = false,
  onChange,
}: SetScoreInputProps) {
  const hasBoth = typeof scoreTeam1 === "number" && typeof scoreTeam2 === "number";
  const team1Won = hasBoth && (scoreTeam1 as number) > (scoreTeam2 as number);
  const team2Won = hasBoth && (scoreTeam2 as number) > (scoreTeam1 as number);

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] p-2.5 sm:p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--vibe-fg-faint)]">
          Satz {setNumber}
        </span>
        {team1Won ? (
          <span className="h-2 w-2 rounded-full bg-[var(--ok)]" aria-label="Team 1 gewinnt Satz" />
        ) : team2Won ? (
          <span className="h-2 w-2 rounded-full bg-[var(--ok)]" aria-label="Team 2 gewinnt Satz" />
        ) : null}
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <TeamStepper
          team={1}
          value={scoreTeam1}
          disabled={disabled}
          ariaLabel={`Satz ${setNumber} Team 1`}
          onChange={onChange}
        />
        <span className="shrink-0 font-mono text-base text-[var(--vibe-fg-faint)]">:</span>
        <TeamStepper
          team={2}
          value={scoreTeam2}
          disabled={disabled}
          ariaLabel={`Satz ${setNumber} Team 2`}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
