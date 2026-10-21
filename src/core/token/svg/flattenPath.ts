import type { Vec2 } from "../types";
import type { PathCommand } from "./parsePathData";

const MAX_SUBDIVISION_DEPTH = 16;

type CubicSegment = {
  p0: Vec2;
  p1: Vec2;
  p2: Vec2;
  p3: Vec2;
};

const midpoint = (a: Vec2, b: Vec2): Vec2 => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
];

const subdivideCubic = (
  segment: CubicSegment,
): [CubicSegment, CubicSegment] => {
  const p01 = midpoint(segment.p0, segment.p1);
  const p12 = midpoint(segment.p1, segment.p2);
  const p23 = midpoint(segment.p2, segment.p3);
  const p012 = midpoint(p01, p12);
  const p123 = midpoint(p12, p23);
  const splitPoint = midpoint(p012, p123);

  return [
    { p0: segment.p0, p1: p01, p2: p012, p3: splitPoint },
    { p0: splitPoint, p1: p123, p2: p23, p3: segment.p3 },
  ];
};

const distanceFromChord = (
  point: Vec2,
  chordStart: Vec2,
  chordEnd: Vec2,
): number => {
  const chordLength = Math.hypot(
    chordEnd[0] - chordStart[0],
    chordEnd[1] - chordStart[1],
  );

  if (chordLength === 0) {
    return Math.hypot(point[0] - chordStart[0], point[1] - chordStart[1]);
  }

  const crossProduct =
    (chordEnd[0] - chordStart[0]) * (point[1] - chordStart[1]) -
    (chordEnd[1] - chordStart[1]) * (point[0] - chordStart[0]);

  return Math.abs(crossProduct) / chordLength;
};

const QUADRATIC_DEGREE = 2;
const CUBIC_DEGREE = 3;
// Degree elevation: a cubic's controls sit this far from each end toward the quadratic's control.
const QUADRATIC_TO_CUBIC_FACTOR = QUADRATIC_DEGREE / CUBIC_DEGREE;

const elevateQuadraticToCubic = (
  p0: Vec2,
  control: Vec2,
  p2: Vec2,
): CubicSegment => {
  const p1: Vec2 = [
    p0[0] + (control[0] - p0[0]) * QUADRATIC_TO_CUBIC_FACTOR,
    p0[1] + (control[1] - p0[1]) * QUADRATIC_TO_CUBIC_FACTOR,
  ];

  const p2Cubic: Vec2 = [
    p2[0] + (control[0] - p2[0]) * QUADRATIC_TO_CUBIC_FACTOR,
    p2[1] + (control[1] - p2[1]) * QUADRATIC_TO_CUBIC_FACTOR,
  ];

  return { p0, p1, p2: p2Cubic, p3: p2 };
};

const flattenCubicSegment = (
  segment: CubicSegment,
  toleranceMm: number,
  remainingDepth: number,
  out: Vec2[],
): void => {
  const deviation = Math.max(
    distanceFromChord(segment.p1, segment.p0, segment.p3),
    distanceFromChord(segment.p2, segment.p0, segment.p3),
  );

  if (deviation <= toleranceMm || remainingDepth === 0) {
    out.push(segment.p3);
    return;
  }

  const [left, right] = subdivideCubic(segment);

  flattenCubicSegment(left, toleranceMm, remainingDepth - 1, out);
  flattenCubicSegment(right, toleranceMm, remainingDepth - 1, out);
};

export const flattenPath = (
  commands: PathCommand[],
  toleranceMm: number,
): Vec2[][] => {
  const contours: Vec2[][] = [];
  let currentContour: Vec2[] = [];
  let currentPoint: Vec2 = [0, 0];

  for (const command of commands) {
    if (command.type === "move") {
      if (currentContour.length > 0) {
        contours.push(currentContour);
      }

      currentContour = [[command.x, command.y]];
      currentPoint = [command.x, command.y];
    } else if (command.type === "line") {
      currentContour.push([command.x, command.y]);
      currentPoint = [command.x, command.y];
    } else if (command.type === "cubic") {
      const segment: CubicSegment = {
        p0: currentPoint,
        p1: [command.x1, command.y1],
        p2: [command.x2, command.y2],
        p3: [command.x, command.y],
      };

      flattenCubicSegment(
        segment,
        toleranceMm,
        MAX_SUBDIVISION_DEPTH,
        currentContour,
      );
      currentPoint = [command.x, command.y];
    } else if (command.type === "quad") {
      const segment = elevateQuadraticToCubic(
        currentPoint,
        [command.x1, command.y1],
        [command.x, command.y],
      );

      flattenCubicSegment(
        segment,
        toleranceMm,
        MAX_SUBDIVISION_DEPTH,
        currentContour,
      );
      currentPoint = [command.x, command.y];
    }
  }

  if (currentContour.length > 0) {
    contours.push(currentContour);
  }

  return contours;
};
