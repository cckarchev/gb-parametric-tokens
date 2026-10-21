import { describe, expect, it } from "vitest";

import { DEGREES_PER_RADIAN } from "./angleConventions";
import { computeCrestFreeSweepDeg } from "./crestFreeSweep";

const CENTER_ANGLE_DEG = 90;
// The band of text the crests are checked against.
const BAND = { minRadiusMm: 18, maxRadiusMm: 20 };
const PRECISION_DIGITS = 1;

const polar = (radiusMm: number, angleDeg: number): [number, number] => {
  const angleRad = angleDeg / DEGREES_PER_RADIAN;

  return [radiusMm * Math.cos(angleRad), radiusMm * Math.sin(angleRad)];
};

type PatchSpan = {
  minRadiusMm: number;
  maxRadiusMm: number;
  fromAngleDeg: number;
  toAngleDeg: number;
};

// A crest-like patch between two radii and two angles, its corners on the polar grid.
const patch = ({
  minRadiusMm,
  maxRadiusMm,
  fromAngleDeg,
  toAngleDeg,
}: PatchSpan) => [
  polar(minRadiusMm, fromAngleDeg),
  polar(minRadiusMm, toAngleDeg),
  polar(maxRadiusMm, toAngleDeg),
  polar(maxRadiusMm, fromAngleDeg),
];

// Patches that straddle the band, one either side of the center.
const RIGHT_SPAN = {
  minRadiusMm: 17,
  maxRadiusMm: 21,
  fromAngleDeg: 30,
  toAngleDeg: 50,
};
const LEFT_SPAN = {
  minRadiusMm: 17,
  maxRadiusMm: 21,
  fromAngleDeg: 125,
  toAngleDeg: 150,
};

const sweepFreeOf = (crests: [number, number][][], clearanceMm = 0) =>
  computeCrestFreeSweepDeg(
    crests,
    CENTER_ANGLE_DEG,
    BAND.minRadiusMm,
    BAND.maxRadiusMm,
    clearanceMm,
  );

describe("computeCrestFreeSweepDeg", () => {
  it("sets no limit when no crest reaches the band", () => {
    const below = patch({
      minRadiusMm: 5,
      maxRadiusMm: 10,
      fromAngleDeg: 30,
      toAngleDeg: 50,
    });

    expect(sweepFreeOf([below])).toBeUndefined();
  });

  it("frees the sweep up to the crest edge nearest the center, on both sides", () => {
    // The right crest reaches 40° from the center, the left one 35°: the nearer one wins.
    const sweepDeg = sweepFreeOf([patch(RIGHT_SPAN), patch(LEFT_SPAN)]);
    const leftReachDeg = LEFT_SPAN.fromAngleDeg - CENTER_ANGLE_DEG;

    expect(sweepDeg).toBeCloseTo(2 * leftReachDeg, PRECISION_DIGITS);
  });

  it("finds a crest edge that crosses the band with no corner inside it", () => {
    const spoke = { innerMm: 10, outerMm: 30, nearDeg: 60, farDeg: 55 };
    const spokeContour = [
      polar(spoke.innerMm, spoke.nearDeg),
      polar(spoke.outerMm, spoke.nearDeg),
      polar(spoke.outerMm, spoke.farDeg),
      polar(spoke.innerMm, spoke.farDeg),
    ];

    const sweepDeg = sweepFreeOf([spokeContour]);
    const reachDeg = CENTER_ANGLE_DEG - spoke.nearDeg;

    expect(sweepDeg).toBeCloseTo(2 * reachDeg, PRECISION_DIGITS);
  });

  it("keeps the clearance off each crest, measured along the band's inner edge", () => {
    const clearanceMm = 0.5;
    const clearanceDeg = (clearanceMm / BAND.minRadiusMm) * DEGREES_PER_RADIAN;

    const sweepDeg = sweepFreeOf([patch(RIGHT_SPAN)], clearanceMm);
    const rightReachDeg = CENTER_ANGLE_DEG - RIGHT_SPAN.toAngleDeg;

    expect(sweepDeg).toBeCloseTo(
      2 * (rightReachDeg - clearanceDeg),
      PRECISION_DIGITS,
    );
  });
});
