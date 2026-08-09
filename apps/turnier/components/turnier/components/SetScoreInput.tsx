import { Minus, Plus } from "lucide-react";
import { stepperBtn } from "@/components/turnier/styles";

type SetScoreInputProps = {
  setNumber: number;
  scoreTeam1?: number;
  scoreTeam2?: number;
  team1Label?: string;
  team2Label?: string;
  disabled?: boolean;
  onChange: (team: 1 | 2, value: string) => void;
};

const MAX_SCORE = 99;

/**
 * Eine Zeile pro Team (untereinander statt nebeneinander).
 * Nebeneinander passten zwei Stepper + Eingabefeld selbst auf dem iPad nicht in
 * die Match-Spalte – das Zahlenfeld wurde auf wenige Pixel zusammengedrückt.
 * Untereinander bleibt das Feld auf jeder Breite lesbar und die Zuordnung
 * Team → Ergebnis ist durch das Label eindeutig.
 */
function TeamRow({
  team,
  label,
  value,
  disabled,
  won,
  ariaLabel,
  onChange,
}: {
  team: 1 | 2;
  label?: string;
  value?: number;
  disabled: boolean;
  won: boolean;
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
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            won ? "bg-[var(--ok)]" : "bg-[var(--vibe-line-strong)]"
          }`}
          aria-hidden
        />
        <span className="min-w-0 truncate text-xs font-semibold text-[var(--vibe-fg-muted)]">
          {label ?? `Team ${team}`}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
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
          className="h-12 w-14 shrink-0 rounded-[var(--vibe-r-lg)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-1 text-center font-mono text-xl font-bold text-[var(--vibe-fg-base)] shadow-[var(--vibe-shadow-flat)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 disabled:opacity-40 disabled:pointer-events-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
      </span>
    </div>
  );
}

export function SetScoreInput({
  setNumber,
  scoreTeam1,
  scoreTeam2,
  team1Label,
  team2Label,
  disabled = false,
  onChange,
}: SetScoreInputProps) {
  const hasBoth = typeof scoreTeam1 === "number" && typeof scoreTeam2 === "number";
  const team1Won = hasBoth && (scoreTeam1 as number) > (scoreTeam2 as number);
  const team2Won = hasBoth && (scoreTeam2 as number) > (scoreTeam1 as number);

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] p-2.5 sm:p-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--vibe-fg-faint)]">
        Satz {setNumber}
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <TeamRow
          team={1}
          label={team1Label}
          value={scoreTeam1}
          disabled={disabled}
          won={team1Won}
          ariaLabel={`Satz ${setNumber} ${team1Label ?? "Team 1"}`}
          onChange={onChange}
        />
        <TeamRow
          team={2}
          label={team2Label}
          value={scoreTeam2}
          disabled={disabled}
          won={team2Won}
          ariaLabel={`Satz ${setNumber} ${team2Label ?? "Team 2"}`}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
