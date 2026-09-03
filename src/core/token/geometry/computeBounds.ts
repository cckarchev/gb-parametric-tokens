import { Vec2 } from "../types";

export type Bounds = { min: Vec2; max: Vec2 };

export const computeBounds = (contours: Vec2[][]): Bounds => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const contour of contours) {
    for (const [x, y] of contour) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { min: [minX, minY], max: [maxX, maxY] };
};
