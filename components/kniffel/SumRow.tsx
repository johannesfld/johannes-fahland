import type { PlayerScores } from "@/components/kniffel/constants";

type SumRowProps = {
  label: string;
  players: PlayerScores[];
  calc: (s: PlayerScores) => number;
  highlight?: boolean;
  large?: boolean;
};

export function SumRow({
  label,
  players,
  calc,
  highlight,
  large,
}: SumRowProps) {
  return (
    <tr
      className={`${
        highlight ? "bg-amber-50 dark:bg-amber-900/10" : "bg-zinc-50 dark:bg-zinc-800/30"
      }`}
    >
      <td className="sticky left-0 z-10 bg-inherit p-4 font-black uppercase text-[10px] tracking-widest border-r dark:border-zinc-700">
        {label}
      </td>
      {players.map((s, i) => (
        <td
          key={i}
          className={`p-4 text-center font-black ${
            large ? "text-xl text-amber-500" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {calc(s)}
        </td>
      ))}
    </tr>
  );
}
