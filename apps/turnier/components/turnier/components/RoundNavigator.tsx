import { selectChevron } from "@/components/turnier/styles";

type RoundNavigatorProps = {
  rounds: number[];
  activeRound: number | null;
  onPrev: () => void;
  onNext: () => void;
  onPick: (roundNumber: number) => void;
};

export function RoundNavigator({
  rounds,
  activeRound,
  onPrev,
  onNext,
  onPick,
}: RoundNavigatorProps) {
  const hasRounds = rounds.length > 0;
  const selectedValue = activeRound ?? "";

  return (
    <div className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-1">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasRounds}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-[var(--vibe-fg-muted)] transition duration-200 [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)] [@media(hover:hover)]:hover:text-[var(--accent)] disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Vorherige Runde"
      >
        ‹
      </button>
      <select
        value={selectedValue}
        onChange={(event) => onPick(Number(event.target.value))}
        disabled={!hasRounds}
        style={selectChevron}
        className="min-h-9 min-w-0 appearance-none rounded-full bg-transparent bg-[length:12px_12px] bg-[right_0.7rem_center] bg-no-repeat py-1 pl-3 pr-7 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vibe-fg-base)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 disabled:opacity-40 disabled:pointer-events-none"
      >
        {!hasRounds ? <option value="">Noch keine Runde</option> : null}
        {rounds.map((roundNumber) => (
          <option key={roundNumber} value={roundNumber}>
            Runde {roundNumber}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasRounds}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-[var(--vibe-fg-muted)] transition duration-200 [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)] [@media(hover:hover)]:hover:text-[var(--accent)] disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Nächste Runde"
      >
        ›
      </button>
    </div>
  );
}
