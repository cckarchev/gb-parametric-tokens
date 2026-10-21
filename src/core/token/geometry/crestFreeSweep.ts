import type { Vec2 } from "../types";
import { DEGREES_PER_RADIAN } from "./angleConventions";

const FULL_TURN_DEG = 360;
const HALF_TURN_DEG = 180;

// Edges are walked in steps this long, so a long straight crest edge that crosses the band with
// no corner inside it still counts.
const EDGE_SAMPLE_STEP_MM = 0.05;

const sampleEdge = (from: Vec2, to: Vec2): Vec2[] => {
  const lengthMm = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const stepCount = Math.max(1, Math.ceil(lengthMm / EDGE_SAMPLE_STEP_MM));
  const samples: Vec2[] = [];

  for (let step = 0; step < stepCount; step++) {
    const t = step / stepCount;

    samples.push([
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
    ]);
  }

  return samples;
};

const sampleContour = (contour: Vec2[]): Vec2[] =>
  contour.flatMap((point, index) => {
    const next = contour[(index + 1) % contour.length];

    return sampleEdge(point, next);
  });

// Angle between two directions, folded into 0..180 so either side of the center reads the same.
const angularDistanceDeg = (
  angleDeg: number,
  centerAngleDeg: number,
): number => {
  const differenceDeg = Math.abs(angleDeg - centerAngleDeg) % FULL_TURN_DEG;

  return differenceDeg > HALF_TURN_DEG
    ? FULL_TURN_DEG - differenceDeg
    : differenceDeg;
};

// The sweep, centered on centerAngleDeg, that a line of text between minRadiusMm and maxRadiusMm
// can use without touching the crests: up to the crest point nearest the center on either side,
// less clearanceMm off each. The clearance is converted to an angle at the band's inner edge,
// where the same gap takes the most degrees. Undefined when no crest reaches the band.
export const computeCrestFreeSweepDeg = (
  crestContours: Vec2[][],
  centerAngleDeg: number,
  minRadiusMm: number,
  maxRadiusMm: number,
  clearanceMm: number,
): number | undefined => {
  const pointsInBand = crestContours.flatMap(sampleContour).filter((point) => {
    const radiusMm = Math.hypot(point[0], point[1]);

    return radiusMm >= minRadiusMm && radiusMm <= maxRadiusMm;
  });

  if (pointsInBand.length === 0) {
    return undefined;
  }

  // A reduce, not Math.min(...points): a detailed crest samples into more points than a spread
  // call takes arguments.
  const nearestCrestDeg = pointsInBand.reduce((nearestDeg, point) => {
    const angleDeg = Math.atan2(point[1], point[0]) * DEGREES_PER_RADIAN;

    return Math.min(nearestDeg, angularDistanceDeg(angleDeg, centerAngleDeg));
  }, Number.POSITIVE_INFINITY);
  const clearanceDeg = (clearanceMm / minRadiusMm) * DEGREES_PER_RADIAN;

  return 2 * Math.max(0, nearestCrestDeg - clearanceDeg);
};
