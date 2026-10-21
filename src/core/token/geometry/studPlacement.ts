import type { ArcShapeSpec, Vec2 } from "../types";
import { DEGREES_PER_RADIAN } from "./angleConventions";

export type StudPlacement = {
  position: Vec2;
  angleDeg: number;
};

export type StudPlacements = {
  left: StudPlacement;
  right: StudPlacement;
};

// The standard miniature base (30mm) the ribbon's inner edge wraps around.
export const MODEL_BASE_DIAMETER_MM = 30;
// Total radial clearance between the base and the ribbon's inner edge, so the ribbon never
// binds against a real base of exactly MODEL_BASE_DIAMETER_MM.
export const BASE_CLEARANCE_MM = 0.5;

// The ribbon's inner radius: half the base diameter plus half the clearance.
export const computeInnerRadiusMm = (): number =>
  (MODEL_BASE_DIAMETER_MM + BASE_CLEARANCE_MM) / 2;

export const computeOuterRadiusMm = (shape: ArcShapeSpec): number =>
  computeInnerRadiusMm() + shape.ribbonWidthMm;

// ribbonLengthMm is an arc length in mm, measured on the fixed inner radius: the same
// radius the stud's touching vertex sits on (see computeStudPlacements below).
export const computeSweepDeg = (shape: ArcShapeSpec): number =>
  (shape.ribbonLengthMm / computeInnerRadiusMm()) * DEGREES_PER_RADIAN;

// The stud's real size. A stud narrower than the ribbon would leave the ribbon's straight end
// sticking out as a notch, so it grows to the ribbon's width. shape.studDiameterMm stays the
// value the user typed.
export const computeEffectiveStudDiameterMm = (shape: ArcShapeSpec): number =>
  Math.max(shape.studDiameterMm, shape.ribbonWidthMm);

export const computeStudPlacements = (
  shape: ArcShapeSpec,
  centerAngleDeg: number,
): StudPlacements => {
  const sweepDeg = computeSweepDeg(shape);
  const halfSweepDeg = sweepDeg / 2;
  const innerRadiusMm = computeInnerRadiusMm();
  const studRadiusMm = computeEffectiveStudDiameterMm(shape) / 2;

  // One stud radius beyond the ribbon's inner corner, on the same ray, so the corner sits on
  // the stud's edge. A bigger stud only moves its own center outward.
  const studCenterRadiusMm = innerRadiusMm + studRadiusMm;

  const leftAngleDeg = centerAngleDeg + halfSweepDeg;
  const rightAngleDeg = centerAngleDeg - halfSweepDeg;

  const positionAtAngle = (angleDeg: number): Vec2 => {
    const angleRad = angleDeg / DEGREES_PER_RADIAN;

    return [
      studCenterRadiusMm * Math.cos(angleRad),
      studCenterRadiusMm * Math.sin(angleRad),
    ];
  };

  return {
    left: { position: positionAtAngle(leftAngleDeg), angleDeg: leftAngleDeg },
    right: {
      position: positionAtAngle(rightAngleDeg),
      angleDeg: rightAngleDeg,
    },
  };
};
