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

// ribbonLengthMm is an arc length in mm, measured on the fixed inner radius -- the same
// radius the stud's touching vertex sits on (see computeStudPlacements below).
export const computeSweepDeg = (shape: ArcShapeSpec): number => {
  return (shape.ribbonLengthMm / computeInnerRadiusMm()) * DEGREES_PER_RADIAN;
};

// If the ribbon is wider than the nominal stud, the ribbon's straight end edge would poke out
// past the stud's curve (a visible notch), because the stud's own circle only reaches
// studDiameterMm past the ribbon's inner-edge vertex. Growing the effective diameter to match
// the ribbon's width (never shrinking a stud the user actually asked to be bigger) keeps the
// stud's curve enclosing the whole end edge. Every geometry/icon/placement call site that needs
// the stud's real, rendered size uses this -- shape.studDiameterMm itself stays the user's
// nominal, as-typed value.
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

  // The stud's center sits further out along the same ray as the ribbon's own inner-edge
  // vertex (innerRadiusMm, at the sweep's end angle), at exactly studRadiusMm beyond it -- so
  // that vertex point always lands exactly on the stud's circumference. Growing studDiameterMm
  // only pushes the center further out; it never moves the vertex, the ribbon, or (since the
  // base-reference circle is now concentric with this same origin, see svgBaseReference.ts)
  // the circle.
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
