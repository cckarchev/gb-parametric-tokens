import { HALF_TURN_DEG, normalizeAngleDeg } from "../geometry/angleConventions";

// A line in the lower half of a ring reads inward, so it stays upright for the
// same viewer as one along the top.
export const resolveRingLineOrientation = (
  centerAngleDeg: number,
): "outward" | "inward" => {
  const normalizedAngleDeg = normalizeAngleDeg(centerAngleDeg);
  const isLowerHalf = normalizedAngleDeg > HALF_TURN_DEG;

  return isLowerHalf ? "inward" : "outward";
};
