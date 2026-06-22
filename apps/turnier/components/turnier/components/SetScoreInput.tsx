type SetScoreInputProps = {
  setNumber: number;
  scoreTeam1?: number;
  scoreTeam2?: number;
  disabled?: boolean;
  onChange: (team: 1 | 2, value: string) => void;
};

export function SetScoreInput({
  setNumber,
  scoreTeam1,
  scoreTeam2,
  disabled = false,
  onChange,
}: SetScoreInputProps) {
  return (
    <div className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] p-2 sm:p-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
        S{setNumber}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={scoreTeam1 ?? ""}
        onChange={(event) => onChange(1, event.target.value)}
        placeholder="0"
        disabled={disabled}
        aria-label={`Satz ${setNumber} Team 1`}
        className="min-h-12 w-full min-w-0 rounded-xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-2 text-center font-mono text-lg font-bold text-[var(--vibe-fg-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 disabled:opacity-40 disabled:pointer-events-none"
      />
      <span className="font-mono text-base text-[var(--vibe-fg-faint)]">:</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={scoreTeam2 ?? ""}
        onChange={(event) => onChange(2, event.target.value)}
        placeholder="0"
        disabled={disabled}
        aria-label={`Satz ${setNumber} Team 2`}
        className="min-h-12 w-full min-w-0 rounded-xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-2 text-center font-mono text-lg font-bold text-[var(--vibe-fg-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 disabled:opacity-40 disabled:pointer-events-none"
      />
    </div>
  );
}
