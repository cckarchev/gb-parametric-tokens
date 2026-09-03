import { Vec2 } from "../types";

export type PlateLayout = { count: number; columns: number; spacingMm: number };

export const computePlateOffsets = (layout: PlateLayout): Vec2[] => {
  const offsets: Vec2[] = [];

  for (let index = 0; index < layout.count; index++) {
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);

    offsets.push([column * layout.spacingMm, row * layout.spacingMm]);
  }

  return offsets;
};
