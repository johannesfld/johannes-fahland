import type { Card, GameMode, GameState } from "./types";

const SYMBOLS_4 = ["🎯", "🎲", "🃏", "♟️", "🎸", "🎺", "🎻", "🥁"];
const SYMBOLS_6 = [
  "🎯", "🎲", "🃏", "♟️", "🎸", "🎺", "🎻", "🥁",
  "🎮", "🎳", "🏆", "🎪", "🎨", "🎭", "🎬", "🎤",
  "🎹", "🎵",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialState(gridSize: 4 | 6 = 4, mode: GameMode = "1p"): GameState {
  const count = gridSize === 4 ? 8 : 18;
  const pool = gridSize === 4 ? SYMBOLS_4 : SYMBOLS_6;
  const pairs = shuffle([...pool.slice(0, count), ...pool.slice(0, count)]);
  const cards: Card[] = pairs.map((symbol, i) => ({
    id: i,
    symbol,
    state: "hidden",
  }));
  return {
    cards,
    flipped: [],
    moves: 0,
    matched: 0,
    status: "idle",
    mode,
    scores: [0, 0],
    currentPlayer: 0,
    gridSize,
    lockBoard: false,
  };
}

export function flipCard(state: GameState, id: number): GameState {
  if (state.lockBoard) return state;
  if (state.status === "won") return state;
  const card = state.cards[id];
  if (!card || card.state !== "hidden") return state;
  if (state.flipped.includes(id)) return state;

  const newCards = state.cards.map((c) =>
    c.id === id ? { ...c, state: "flipped" as const } : c
  );
  const newFlipped = [...state.flipped, id];
  const newStatus = state.status === "idle" ? "running" : state.status;

  if (newFlipped.length < 2) {
    return { ...state, cards: newCards, flipped: newFlipped, status: newStatus };
  }

  // Second flip — check match
  const [first, second] = newFlipped;
  const isMatch = state.cards[first].symbol === state.cards[second].symbol;

  if (isMatch) {
    const matchedCards = newCards.map((c) =>
      c.id === first || c.id === second ? { ...c, state: "matched" as const } : c
    );
    const newMatched = state.matched + 1;
    const totalPairs = state.cards.length / 2;
    const won = newMatched === totalPairs;

    const newScores = [...state.scores] as [number, number];
    newScores[state.currentPlayer] += 1;

    return {
      ...state,
      cards: matchedCards,
      flipped: [],
      moves: state.moves + 1,
      matched: newMatched,
      status: won ? "won" : "running",
      scores: newScores,
    };
  }

  // No match — lock board, will be unflipped after delay
  const nextPlayer: 0 | 1 = state.mode === "2p"
    ? (state.currentPlayer === 0 ? 1 : 0)
    : 0;

  return {
    ...state,
    cards: newCards,
    flipped: newFlipped,
    moves: state.moves + 1,
    lockBoard: true,
    status: newStatus,
    currentPlayer: nextPlayer,
  };
}

export function unflipMismatched(state: GameState): GameState {
  if (!state.lockBoard) return state;
  const [first, second] = state.flipped;
  const newCards = state.cards.map((c) =>
    c.id === first || c.id === second ? { ...c, state: "hidden" as const } : c
  );
  return { ...state, cards: newCards, flipped: [], lockBoard: false };
}
