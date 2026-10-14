import { ArcShapeSpec, Vec2 } from "../types";
import { DEGREES_PER_RADIAN } from "./angleConventions";

export type StudPlacement = {
  position: Vec2;
  angleDeg: number;
};

export type StudPlacements = {
  left: StudPlacement;
  right: StudPlacement;
};

// The diameter of a standard miniature base (30mm) the ribbon's inner edge wraps around.
// Shared, not per-shape, until a future base-size selector makes it one (see the design doc).
export const MODEL_BASE_DIAMETER_MM = 30;
// Total radial clearance between the base and the ribbon's inner edge, so the ribbon never
// binds against a real base of exactly MODEL_BASE_DIAMETER_MM.
export const BASE_CLEARANCE_MM = 0.5;

// The ribbon's inner radius is fixed, not a free parameter: it's always exactly half the base
// diameter plus half the clearance. Written as a function (not a constant) so a future
// per-shape base diameter is a one-line change at the call site, not a new function.
export const computeInnerRadiusMm = (): number => {
  return (MODEL_BASE_DIAMETER_MM + BASE_CLEARANCE_MM) / 2;
};

export const computeOuterRadiusMm = (shape: ArcShapeSpec): number => {
  return computeInnerRadiusMm() + shape.ribbonWidthMm;
};

// ribbonLengthMm is an arc length in mm, measured on the fixed inner radius: the same
// radius the stud's touching vertex sits on (see computeStudPlacements below).
export const computeSweepDeg = (shape: ArcShapeSpec): number => {
  return (shape.ribbonLengthMm / computeInnerRadiusMm()) * DEGREES_PER_RADIAN;
};

// The stud's real size. A stud narrower than the ribbon would leave the ribbon's straight end
// sticking out as a notch, so it grows to the ribbon's width. shape.studDiameterMm stays the
// value the user typed.
export const computeEffectiveStudDiameterMm = (shape: ArcShapeSpec): number => {
  return Math.max(shape.studDiameterMm, shape.ribbonWidthMm);
};

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

    return [studCenterRadiusMm * Math.cos(angleRad), studCenterRadiusMm * Math.sin(angleRad)];
  };

  return {
    left: { position: positionAtAngle(leftAngleDeg), angleDeg: leftAngleDeg },
    right: { position: positionAtAngle(rightAngleDeg), angleDeg: rightAngleDeg },
  };
};
