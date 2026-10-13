const HALF_TURN_DEG = 180;
const FULL_TURN_DEG = 360;

// A ring line in the lower half reads inward, like the bottom line, so it stays upright for the
// same viewer as the top one (see arcPlacement.ts's ArcOrientation doc comment). Shared by the
// ring layout itself (computeRingReliefComponents.ts) and by builders that pick a radius per line
// depending on which way it will read (aoeTemplateSpec.ts).
export const resolveRingLineOrientation = (centerAngleDeg: number): "outward" | "inward" => {
  const normalizedAngleDeg = ((centerAngleDeg % FULL_TURN_DEG) + FULL_TURN_DEG) % FULL_TURN_DEG;
  const isLowerHalf = normalizedAngleDeg > HALF_TURN_DEG;

  return isLowerHalf ? "inward" : "outward";
};
