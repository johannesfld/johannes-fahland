export type Category =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  | "onePair"
  | "twoPairs"
  | "threeKind"
  | "fourKind"
  | "fullHouse"
  | "smallStraight"
  | "largeStraight"
  | "kniffel"
  | "chance";

export type CellValue = { score: number | null; crossed: boolean };
export type PlayerScores = Record<Category, CellValue>;

export const FIXED_PTS: Partial<Record<Category, number>> = {
  smallStraight: 15,
  largeStraight: 20,
  kniffel: 50,
};

export const CAT_LABELS: Record<string, string> = {
  ones: "1er",
  twos: "2er",
  threes: "3er",
  fours: "4er",
  fives: "5er",
  sixes: "6er",
  onePair: "Paar",
  twoPairs: "2 Paare",
  threeKind: "3 Gleiche",
  fourKind: "4 Gleiche",
  fullHouse: "Full House",
  smallStraight: "Kl. Straße",
  largeStraight: "Gr. Straße",
  kniffel: "Kniffel",
  chance: "Chance",
};

export const TOP_CATEGORIES: Category[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
];

export const BOTTOM_CATEGORIES: Category[] = [
  "onePair",
  "twoPairs",
  "threeKind",
  "fourKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "kniffel",
  "chance",
];
