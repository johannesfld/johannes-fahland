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
    <div className="inline-flex min-h-11 items-center gap-1 rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasRounds}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-sm transition duration-200 hover:border-amber-500 hover:text-amber-600 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-700"
        aria-label="Vorherige Runde"
      >
        ‹
      </button>
      <select
        value={selectedValue}
        onChange={(event) => onPick(Number(event.target.value))}
        disabled={!hasRounds}
        style={selectChevron}
        className="min-h-8 min-w-0 appearance-none rounded-full border border-zinc-300 bg-white bg-[length:12px_12px] bg-[right_0.7rem_center] bg-no-repeat py-1 pl-3 pr-7 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-600 transition duration-200 hover:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
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
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-sm transition duration-200 hover:border-amber-500 hover:text-amber-600 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-700"
        aria-label="Nächste Runde"
      >
        ›
      </button>
    </div>
  );
}
