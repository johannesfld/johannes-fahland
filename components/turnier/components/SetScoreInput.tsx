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
    <div className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 sm:text-xs sm:tracking-[0.22em]">
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
        className="min-h-12 w-full min-w-0 rounded-xl border border-zinc-300 bg-zinc-50 px-2 text-center text-lg font-bold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C9170]/60 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <span className="text-base font-black text-zinc-400">:</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={scoreTeam2 ?? ""}
        onChange={(event) => onChange(2, event.target.value)}
        placeholder="0"
        disabled={disabled}
        aria-label={`Satz ${setNumber} Team 2`}
        className="min-h-12 w-full min-w-0 rounded-xl border border-zinc-300 bg-zinc-50 px-2 text-center text-lg font-bold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C9170]/60 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
    </div>
  );
}
