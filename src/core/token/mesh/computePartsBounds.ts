import type { Bounds } from "../geometry/computeBounds";
import type { TokenPart } from "./tokenPart";

// The flat (x, y) extent a token covers on the plate, across all of its color parts.
export const computePartsBounds = (parts: TokenPart[]): Bounds => {
  const boxes = parts.map((part) => part.manifold.boundingBox());

  const minX = Math.min(...boxes.map((box) => box.min[0]));
  const minY = Math.min(...boxes.map((box) => box.min[1]));
  const maxX = Math.max(...boxes.map((box) => box.max[0]));
  const maxY = Math.max(...boxes.map((box) => box.max[1]));

  return { min: [minX, minY], max: [maxX, maxY] };
};
