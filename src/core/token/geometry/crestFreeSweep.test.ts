import { describe, expect, it } from "vitest";

import { DEGREES_PER_RADIAN } from "./angleConventions";
import { computeCrestFreeSweepDeg } from "./crestFreeSweep";

const CENTER_ANGLE_DEG = 90;

const polar = (radiusMm: number, angleDeg: number): [number, number] => {
  const angleRad = angleDeg / DEGREES_PER_RADIAN;

  return [radiusMm * Math.cos(angleRad), radiusMm * Math.sin(angleRad)];
};

// A crest-like patch between two radii and two angles, its corners on the polar grid.
const patch = (
  minRadiusMm: number,
  maxRadiusMm: number,
  fromAngleDeg: number,
  toAngleDeg: number,
) => [
  polar(minRadiusMm, fromAngleDeg),
  polar(minRadiusMm, toAngleDeg),
  polar(maxRadiusMm, toAngleDeg),
  polar(maxRadiusMm, fromAngleDeg),
];

describe("computeCrestFreeSweepDeg", () => {
  it("sets no limit when no crest reaches the band", () => {
    const below = patch(5, 10, 30, 50);

    expect(computeCrestFreeSweepDeg([below], CENTER_ANGLE_DEG, 18, 20, 0)).toBeUndefined();
  });

  it("frees the sweep up to the crest edge nearest the center, on both sides", () => {
    const right = patch(17, 21, 30, 50);
    const left = patch(17, 21, 125, 150);

    // The right crest reaches 40° from the center, the left one 35°: the nearer one wins.
    const sweepDeg = computeCrestFreeSweepDeg([right, left], CENTER_ANGLE_DEG, 18, 20, 0);

    expect(sweepDeg).toBeCloseTo(2 * 35, 1);
  });

  it("finds a crest edge that crosses the band with no corner inside it", () => {
    const spoke = [polar(10, 60), polar(30, 60), polar(30, 55), polar(10, 55)];

    const sweepDeg = computeCrestFreeSweepDeg([spoke], CENTER_ANGLE_DEG, 18, 20, 0);

    expect(sweepDeg).toBeCloseTo(2 * 30, 1);
  });

  it("keeps the clearance off each crest, measured along the band's inner edge", () => {
    const right = patch(17, 21, 30, 50);
    const clearanceMm = 0.5;
    const minRadiusMm = 18;
    const clearanceDeg = (clearanceMm / minRadiusMm) * DEGREES_PER_RADIAN;

    const sweepDeg = computeCrestFreeSweepDeg(
      [right],
      CENTER_ANGLE_DEG,
      minRadiusMm,
      20,
      clearanceMm,
    );

    expect(sweepDeg).toBeCloseTo(2 * (40 - clearanceDeg), 1);
  });
});
