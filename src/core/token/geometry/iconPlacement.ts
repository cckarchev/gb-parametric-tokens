import { Vec2 } from "../types";

export type IconPlacementOptions = {
  targetDiameterMm: number;
  scale: number;
};

const flipY = (contours: Vec2[][]): Vec2[][] => {
  return contours.map((contour) => contour.map(([x, y]): Vec2 => [x, -y]));
};

const computeBounds = (contours: Vec2[][]): { min: Vec2; max: Vec2 } => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

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

export const placeIcon = (contours: Vec2[][], options: IconPlacementOptions): Vec2[][] => {
  const flipped = flipY(contours);
  const bounds = computeBounds(flipped);

  const boundsWidth = bounds.max[0] - bounds.min[0];
  const boundsHeight = bounds.max[1] - bounds.min[1];
  const largestDimension = Math.max(boundsWidth, boundsHeight);

  const center: Vec2 = [(bounds.min[0] + bounds.max[0]) / 2, (bounds.min[1] + bounds.max[1]) / 2];
  const scaleFactor = (options.targetDiameterMm * options.scale) / largestDimension;

  return flipped.map((contour) =>
    contour.map(([x, y]): Vec2 => [(x - center[0]) * scaleFactor, (y - center[1]) * scaleFactor]),
  );
};

export const translateContours = (contours: Vec2[][], offset: Vec2): Vec2[][] => {
  return contours.map((contour) => contour.map(([x, y]): Vec2 => [x + offset[0], y + offset[1]]));
};
