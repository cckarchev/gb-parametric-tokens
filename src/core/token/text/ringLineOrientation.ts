const HALF_TURN_DEG = 180;
const FULL_TURN_DEG = 360;

// A line in the lower half of a ring reads inward, so it stays upright for the same viewer as
// one along the top.
export const resolveRingLineOrientation = (
  centerAngleDeg: number,
): "outward" | "inward" => {
  const normalizedAngleDeg =
    ((centerAngleDeg % FULL_TURN_DEG) + FULL_TURN_DEG) % FULL_TURN_DEG;
  const isLowerHalf = normalizedAngleDeg > HALF_TURN_DEG;

  return isLowerHalf ? "inward" : "outward";
};
