import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="inline-flex min-h-12 items-center gap-0.5 rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-1 shadow-[var(--vibe-shadow-soft)]">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasRounds}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--vibe-fg-muted)] transition-[transform,background-color,color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)] [@media(hover:hover)]:hover:text-[var(--accent)] active:scale-[0.9] disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Vorherige Runde"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <select
        value={selectedValue}
        onChange={(event) => onPick(Number(event.target.value))}
        disabled={!hasRounds}
        style={selectChevron}
        className="min-h-11 min-w-0 appearance-none rounded-full bg-transparent bg-[length:12px_12px] bg-[right_0.7rem_center] bg-no-repeat py-1 pl-3 pr-7 text-xs font-bold uppercase tracking-[0.1em] text-[var(--vibe-fg-base)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 disabled:opacity-40 disabled:pointer-events-none"
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
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--vibe-fg-muted)] transition-[transform,background-color,color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:bg-[var(--vibe-bg-sunken)] [@media(hover:hover)]:hover:text-[var(--accent)] active:scale-[0.9] disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Nächste Runde"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
