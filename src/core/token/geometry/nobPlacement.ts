import { ShapeSpec, Vec2 } from "../types";
import { DEGREES_PER_RADIAN } from "./angleConventions";

export type ArcShapeSpec = Extract<ShapeSpec, { type: "arc" }>;

export type NobPlacement = {
  position: Vec2;
  angleDeg: number;
};

export type NobPlacements = {
  left: NobPlacement;
  right: NobPlacement;
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
// radius the nob's touching vertex sits on (see computeNobPlacements below).
export const computeSweepDeg = (shape: ArcShapeSpec): number => {
  return (shape.ribbonLengthMm / computeInnerRadiusMm()) * DEGREES_PER_RADIAN;
};

// If the ribbon is wider than the nominal nob, the ribbon's straight end edge would poke out
// past the nob's curve (a visible notch), because the nob's own circle only reaches
// nobDiameterMm past the ribbon's inner-edge vertex. Growing the effective diameter to match
// the ribbon's width (never shrinking a nob the user actually asked to be bigger) keeps the
// nob's curve enclosing the whole end edge. Every geometry/icon/placement call site that needs
// the nob's real, rendered size uses this -- shape.nobDiameterMm itself stays the user's
// nominal, as-typed value.
export const computeEffectiveNobDiameterMm = (shape: ArcShapeSpec): number => {
  return Math.max(shape.nobDiameterMm, shape.ribbonWidthMm);
};

export const computeNobPlacements = (
  shape: ArcShapeSpec,
  centerAngleDeg: number,
): NobPlacements => {
  const sweepDeg = computeSweepDeg(shape);
  const halfSweepDeg = sweepDeg / 2;
  const innerRadiusMm = computeInnerRadiusMm();
  const nobRadiusMm = computeEffectiveNobDiameterMm(shape) / 2;

  // The nob's center sits further out along the same ray as the ribbon's own inner-edge
  // vertex (innerRadiusMm, at the sweep's end angle), at exactly nobRadiusMm beyond it -- so
  // that vertex point always lands exactly on the nob's circumference. Growing nobDiameterMm
  // only pushes the center further out; it never moves the vertex, the ribbon, or (since the
  // base-reference circle is now concentric with this same origin, see svgBaseReference.ts)
  // the circle.
  const nobCenterRadiusMm = innerRadiusMm + nobRadiusMm;

  const leftAngleDeg = centerAngleDeg + halfSweepDeg;
  const rightAngleDeg = centerAngleDeg - halfSweepDeg;

  const positionAtAngle = (angleDeg: number): Vec2 => {
    const angleRad = angleDeg / DEGREES_PER_RADIAN;

    return [nobCenterRadiusMm * Math.cos(angleRad), nobCenterRadiusMm * Math.sin(angleRad)];
  };

  return {
    left: { position: positionAtAngle(leftAngleDeg), angleDeg: leftAngleDeg },
    right: { position: positionAtAngle(rightAngleDeg), angleDeg: rightAngleDeg },
  };
};
