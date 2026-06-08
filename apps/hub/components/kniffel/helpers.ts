import {
  BOTTOM_CATEGORIES,
  CAT_LABELS,
  TOP_CATEGORIES,
  type Category,
  type PlayerScores,
} from "@/components/kniffel/constants";

export function createInitialScores(playerCount: number): PlayerScores[] {
  return Array.from({ length: playerCount }, () =>
    Object.keys(CAT_LABELS).reduce(
      (acc, key) => ({ ...acc, [key]: { score: null, crossed: false } }),
      {} as PlayerScores,
    ),
  );
}

export const sum = (s: PlayerScores, keys: string[]) =>
  keys.reduce((a, k) => a + (s[k as Category].score ?? 0), 0);

export const calculateTopSum = (s: PlayerScores) => sum(s, TOP_CATEGORIES);

export const calculateTotal = (s: PlayerScores) => {
  const top = calculateTopSum(s);
  const bonus = top >= 63 ? 25 : 0;
  const bottom = sum(s, BOTTOM_CATEGORIES);
  return top + bonus + bottom;
};
