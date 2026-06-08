export const GRID_SIZE = 10;

export const FLEET = [
  { id: "s5", len: 5 },
  { id: "s4", len: 4 },
  { id: "s3a", len: 3 },
  { id: "s3b", len: 3 },
  { id: "s2", len: 2 },
] as const;

export type FleetShipId = (typeof FLEET)[number]["id"];
