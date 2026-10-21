import { describe, expect, it } from "vitest";

import { DEGREES_PER_RADIAN } from "../geometry/angleConventions";
import type { Vec2 } from "../types";
import { applyArcPlacement, computeArcGlyphPlacements } from "./arcPlacement";

const PRECISION_DIGITS = 9;
const LOOSE_PRECISION_DIGITS = 3;
const TOP_DEG = 90;
const BOTTOM_DEG = 270;
const QUARTER_TURN_DEG = 90;

// Two glyphs of different widths with kerning between them, on a wide circle.
const NARROW_ADVANCE_MM = 10;
const WIDE_ADVANCE_MM = 20;
const KERNING_MM = 5;
const TWO_GLYPHS = {
  advancesMm: [NARROW_ADVANCE_MM, WIDE_ADVANCE_MM],
  kerningsMm: [KERNING_MM],
  radiusMm: 100,
};

// Arc length from the line's center to each glyph's own center: the pen advances, then each
// glyph sits half its own advance further on, and the whole line is centered on the angle.
const TOTAL_WIDTH_MM = NARROW_ADVANCE_MM + KERNING_MM + WIDE_ADVANCE_MM;
const FIRST_CENTER_MM = NARROW_ADVANCE_MM / 2 - TOTAL_WIDTH_MM / 2;
const SECOND_CENTER_MM =
  NARROW_ADVANCE_MM + KERNING_MM + WIDE_ADVANCE_MM / 2 - TOTAL_WIDTH_MM / 2;

// Three equal glyphs, for checks that only care about the order they run in.
const EVEN_ADVANCE_MM = 5;
const THREE_GLYPHS = {
  advancesMm: [EVEN_ADVANCE_MM, EVEN_ADVANCE_MM, EVEN_ADVANCE_MM],
  kerningsMm: [0, 0],
  radiusMm: 40,
};

const arcDeg = (arcLengthMm: number, radiusMm: number): number =>
  (arcLengthMm / radiusMm) * DEGREES_PER_RADIAN;

const degreesToRadians = (deg: number): number => deg / DEGREES_PER_RADIAN;

describe("computeArcGlyphPlacements", () => {
  it("accumulates advances and kerning into arc-length-relative angles, not uniform steps", () => {
    const placements = computeArcGlyphPlacements({
      ...TWO_GLYPHS,
      centerAngleDeg: TOP_DEG,
      coordinateConvention: "svgYDown",
    });

    const expectedAngleDeg0 =
      TOP_DEG - arcDeg(FIRST_CENTER_MM, TWO_GLYPHS.radiusMm);
    const expectedAngleDeg1 =
      TOP_DEG - arcDeg(SECOND_CENTER_MM, TWO_GLYPHS.radiusMm);

    expect(placements[0].angleDeg).toBeCloseTo(
      expectedAngleDeg0,
      PRECISION_DIGITS,
    );
    expect(placements[1].angleDeg).toBeCloseTo(
      expectedAngleDeg1,
      PRECISION_DIGITS,
    );

    // the two glyphs are NOT evenly split around the center angle: that's the bug being fixed.
    const spacing0 = TOP_DEG - placements[0].angleDeg;
    const spacing1 = placements[1].angleDeg - TOP_DEG;
    expect(spacing0).not.toBeCloseTo(spacing1, LOOSE_PRECISION_DIGITS);
  });

  it("places position and rotation consistently with the angle", () => {
    const radiusMm = 50;
    const [placement] = computeArcGlyphPlacements({
      advancesMm: [0],
      kerningsMm: [],
      radiusMm,
      centerAngleDeg: TOP_DEG,
      coordinateConvention: "svgYDown",
    });

    // single glyph with zero advance sits exactly at the center angle
    expect(placement.angleDeg).toBeCloseTo(TOP_DEG, PRECISION_DIGITS);
    expect(placement.position[0]).toBeCloseTo(
      radiusMm * Math.cos(degreesToRadians(TOP_DEG)),
      PRECISION_DIGITS,
    );
    expect(placement.position[1]).toBeCloseTo(
      -radiusMm * Math.sin(degreesToRadians(TOP_DEG)),
      PRECISION_DIGITS,
    );
    expect(placement.rotationDeg).toBeCloseTo(0, PRECISION_DIGITS);
  });
});

describe("computeArcGlyphPlacements order and orientation", () => {
  it("places world-space (mathYUp) position and rotation without the SVG y-negation", () => {
    const radiusMm = 50;
    const [placement] = computeArcGlyphPlacements({
      advancesMm: [0],
      kerningsMm: [],
      radiusMm,
      centerAngleDeg: TOP_DEG,
      coordinateConvention: "mathYUp",
    });

    expect(placement.angleDeg).toBeCloseTo(TOP_DEG, PRECISION_DIGITS);
    expect(placement.position[0]).toBeCloseTo(
      radiusMm * Math.cos(degreesToRadians(TOP_DEG)),
      PRECISION_DIGITS,
    );
    expect(placement.position[1]).toBeCloseTo(
      radiusMm * Math.sin(degreesToRadians(TOP_DEG)),
      PRECISION_DIGITS,
    );
    expect(placement.rotationDeg).toBeCloseTo(0, PRECISION_DIGITS);
  });

  it("returns one placement per advance, in order", () => {
    const placements = computeArcGlyphPlacements({
      ...THREE_GLYPHS,
      centerAngleDeg: 0,
      coordinateConvention: "svgYDown",
    });

    expect(placements.length).toBe(THREE_GLYPHS.advancesMm.length);
    // moving right (increasing pen position) means decreasing angle
    expect(placements[0].angleDeg).toBeGreaterThan(placements[1].angleDeg);
    expect(placements[1].angleDeg).toBeGreaterThan(placements[2].angleDeg);
  });

  // "inward" is for text along the bottom of a circle, still read left to right.

  it("with orientation inward, increases the angle as pen position increases: the opposite of outward's decrease", () => {
    const placements = computeArcGlyphPlacements({
      ...THREE_GLYPHS,
      centerAngleDeg: BOTTOM_DEG,
      coordinateConvention: "mathYUp",
      orientation: "inward",
    });

    expect(placements[0].angleDeg).toBeLessThan(placements[1].angleDeg);
    expect(placements[1].angleDeg).toBeLessThan(placements[2].angleDeg);
  });
});

describe("computeArcGlyphPlacements inward rotation", () => {
  it("rotates glyphs to point toward the center (angleDeg + 90 in mathYUp) when orientation is inward", () => {
    const [placement] = computeArcGlyphPlacements({
      ...TWO_GLYPHS,
      centerAngleDeg: BOTTOM_DEG,
      coordinateConvention: "mathYUp",
      orientation: "inward",
    });

    // Same pen/glyph-center math as "accumulates advances..." above, but inward adds the arc
    // length to the center angle instead of subtracting it.
    const expectedAngleDeg0 =
      BOTTOM_DEG + arcDeg(FIRST_CENTER_MM, TWO_GLYPHS.radiusMm);

    expect(placement.angleDeg).toBeCloseTo(expectedAngleDeg0, PRECISION_DIGITS);
    expect(placement.rotationDeg).toBeCloseTo(
      expectedAngleDeg0 + QUARTER_TURN_DEG,
      PRECISION_DIGITS,
    );
  });

  it("mirrors inward rotation the same way outward already does between mathYUp and svgYDown", () => {
    const [mathYUpPlacement] = computeArcGlyphPlacements({
      ...TWO_GLYPHS,
      centerAngleDeg: BOTTOM_DEG,
      coordinateConvention: "mathYUp",
      orientation: "inward",
    });
    const [svgYDownPlacement] = computeArcGlyphPlacements({
      ...TWO_GLYPHS,
      centerAngleDeg: BOTTOM_DEG,
      coordinateConvention: "svgYDown",
      orientation: "inward",
    });

    expect(svgYDownPlacement.rotationDeg).toBeCloseTo(
      -mathYUpPlacement.rotationDeg,
      PRECISION_DIGITS,
    );
  });
});

describe("computeArcGlyphPlacements default orientation", () => {
  it("defaults to outward orientation when omitted", () => {
    const withDefault = computeArcGlyphPlacements({
      ...TWO_GLYPHS,
      centerAngleDeg: TOP_DEG,
      coordinateConvention: "mathYUp",
    });
    const withExplicitOutward = computeArcGlyphPlacements({
      ...TWO_GLYPHS,
      centerAngleDeg: TOP_DEG,
      coordinateConvention: "mathYUp",
      orientation: "outward",
    });

    expect(withDefault).toEqual(withExplicitOutward);
  });
});

describe("applyArcPlacement", () => {
  it("translates contours by position when rotation is zero", () => {
    const square: Vec2[][] = [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    ];
    const offset = { x: 10, y: 20 };
    const placement = {
      angleDeg: TOP_DEG,
      position: [offset.x, offset.y] as [number, number],
      rotationDeg: 0,
      pivotOffsetMm: 0,
    };

    expect(applyArcPlacement(square, placement)).toEqual([
      [
        [offset.x, offset.y],
        [offset.x + 1, offset.y],
        [offset.x + 1, offset.y + 1],
        [offset.x, offset.y + 1],
      ],
    ]);
  });

  it("rotates a point before translating", () => {
    const point: Vec2[][] = [[[1, 0]]];
    const shiftMm = 5;
    const placement = {
      angleDeg: 0,
      position: [shiftMm, shiftMm] as [number, number],
      rotationDeg: QUARTER_TURN_DEG,
      pivotOffsetMm: 0,
    };

    const [[[x, y]]] = applyArcPlacement(point, placement);

    // (1,0) rotated 90 deg -> (0,1), then shifted.
    expect(x).toBeCloseTo(shiftMm, PRECISION_DIGITS);
    expect(y).toBeCloseTo(shiftMm + 1, PRECISION_DIGITS);
  });
});

describe("applyArcPlacement pivot", () => {
  it("rotates around the glyph's own advance-center, not its pen-start left edge", () => {
    // A wide glyph spanning local x in [0, 10] on the baseline (its own advance is 10mm, so
    // pivotOffsetMm=5 is its horizontal center). Rotating 90deg around that center should
    // swing both its left and right edges symmetrically, not swing the whole span around x=0.
    const wideGlyphBaseline: Vec2[][] = [
      [
        [0, 0],
        [10, 0],
      ],
    ];
    const placement = {
      angleDeg: 0,
      position: [0, 0] as [number, number],
      rotationDeg: QUARTER_TURN_DEG,
      pivotOffsetMm: 5,
    };

    const [[[leftX, leftY], [rightX, rightY]]] = applyArcPlacement(
      wideGlyphBaseline,
      placement,
    );

    // local x=0 is 5mm left of the pivot -> after a 90deg rotation it's 5mm "below" the pivot
    expect(leftX).toBeCloseTo(0, PRECISION_DIGITS);
    expect(leftY).toBeCloseTo(-placement.pivotOffsetMm, PRECISION_DIGITS);
    // local x=10 is 5mm right of the pivot -> after a 90deg rotation it's 5mm "above" the pivot
    expect(rightX).toBeCloseTo(0, PRECISION_DIGITS);
    expect(rightY).toBeCloseTo(placement.pivotOffsetMm, PRECISION_DIGITS);
  });
});
