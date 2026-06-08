import type { Player } from "@/components/wizard/types";

export const DUMMY_PLAYER_NAME = "Bruv";
export const MAX_NAME_LEN = 32;

export const getRoundCount = (players: number) => Math.floor(60 / players);

export const calculatePoints = (bid: number, actual: number) => {
  if (bid === actual) return 20 + actual * 10;
  return -Math.abs(bid - actual) * 10;
};

export const isDummyPlayer = (player: Player | undefined) =>
  Boolean(player && (player.isDummy || player.name === DUMMY_PLAYER_NAME));

export const getEligibleMixerIndexes = (players: Player[]): number[] => {
  const humanIndexes = players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => !isDummyPlayer(player))
    .map(({ index }) => index);
  if (humanIndexes.length > 0) return humanIndexes;
  return players.map((_, index) => index);
};

export const getRandomMixerIndex = (players: Player[]) => {
  const eligibleMixerIndexes = getEligibleMixerIndexes(players);
  return eligibleMixerIndexes[
    Math.floor(Math.random() * eligibleMixerIndexes.length)
  ];
};

export const getNextMixerIndex = (players: Player[], currentMixerIndex: number) => {
  const eligibleMixerIndexes = getEligibleMixerIndexes(players);
  const currentPos = eligibleMixerIndexes.indexOf(currentMixerIndex);
  if (currentPos === -1) return eligibleMixerIndexes[0] ?? 0;
  return (
    eligibleMixerIndexes[(currentPos + 1) % eligibleMixerIndexes.length] ?? 0
  );
};

export const getNextBidderIndex = (mixerIndex: number, playerCount: number) =>
  (mixerIndex + 1) % playerCount;

export const getPlayerOrder = (startIndex: number, playerCount: number): number[] => {
  const order: number[] = [];
  for (let i = 0; i < playerCount; i++) {
    order.push((startIndex + i) % playerCount);
  }
  return order;
};
