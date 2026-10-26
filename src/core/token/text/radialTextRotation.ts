import { HALF_TURN_DEG, normalizeAngleDeg } from "../geometry/angleConventions";

// Text running straight up is still readable (tilt your head left); anything
// past it, up to straight down, would read upside down without the half turn.
const UPRIGHT_LIMIT_DEG = 90;
const UPSIDE_DOWN_LIMIT_DEG = 270;

// A line of text laid along a spoke at spokeAngleDeg: the rotation that runs
// its baseline along that spoke, turned half around when reading outward would
// put it upside down. So a line on a lower left spoke reads toward the center,
// and one on a lower right spoke reads away from it.
export const computeRadialTextRotationDeg = (spokeAngleDeg: number): number => {
  const normalizedAngleDeg = normalizeAngleDeg(spokeAngleDeg);
  const readsUpsideDown =
    normalizedAngleDeg > UPRIGHT_LIMIT_DEG &&
    normalizedAngleDeg <= UPSIDE_DOWN_LIMIT_DEG;

  if (readsUpsideDown) {
    return normalizedAngleDeg - HALF_TURN_DEG;
  }

  return normalizedAngleDeg;
};
