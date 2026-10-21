import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import { applyArcPlacement, computeArcGlyphPlacements } from "./arcPlacement";

const degreesToRadians = (deg: number): number => (deg * Math.PI) / 180;

describe("computeArcGlyphPlacements", () => {
  it("accumulates advances and kerning into arc-length-relative angles, not uniform steps", () => {
    const placements = computeArcGlyphPlacements({
      advancesMm: [10, 20],
      kerningsMm: [5],
      radiusMm: 100,
      centerAngleDeg: 90,
      coordinateConvention: "svgYDown",
    });

    // pen positions: [0, 15]; glyph centers (pen + half its own advance): [5, 25]; total
    // width 35; centered s: [5 - 17.5, 25 - 17.5] = [-12.5, 7.5]
    const expectedAngleDeg0 = 90 - (-12.5 / 100) * (180 / Math.PI);
    const expectedAngleDeg1 = 90 - (7.5 / 100) * (180 / Math.PI);

    expect(placements[0].angleDeg).toBeCloseTo(expectedAngleDeg0, 9);
    expect(placements[1].angleDeg).toBeCloseTo(expectedAngleDeg1, 9);

    // the two glyphs are NOT evenly split around the center angle: that's the bug being fixed.
    const spacing0 = 90 - placements[0].angleDeg;
    const spacing1 = placements[1].angleDeg - 90;
    expect(spacing0).not.toBeCloseTo(spacing1, 3);
  });

  it("places position and rotation consistently with the angle", () => {
    const [placement] = computeArcGlyphPlacements({
      advancesMm: [0],
      kerningsMm: [],
      radiusMm: 50,
      centerAngleDeg: 90,
      coordinateConvention: "svgYDown",
    });

    // single glyph with zero advance sits exactly at the center angle
    expect(placement.angleDeg).toBeCloseTo(90, 9);
    expect(placement.position[0]).toBeCloseTo(
      50 * Math.cos(degreesToRadians(90)),
      9,
    );
    expect(placement.position[1]).toBeCloseTo(
      -50 * Math.sin(degreesToRadians(90)),
      9,
    );
    expect(placement.rotationDeg).toBeCloseTo(0, 9);
  });

  it("places world-space (mathYUp) position and rotation without the SVG y-negation", () => {
    const [placement] = computeArcGlyphPlacements({
      advancesMm: [0],
      kerningsMm: [],
      radiusMm: 50,
      centerAngleDeg: 90,
      coordinateConvention: "mathYUp",
    });

    expect(placement.angleDeg).toBeCloseTo(90, 9);
    expect(placement.position[0]).toBeCloseTo(
      50 * Math.cos(degreesToRadians(90)),
      9,
    );
    expect(placement.position[1]).toBeCloseTo(
      50 * Math.sin(degreesToRadians(90)),
      9,
    );
    expect(placement.rotationDeg).toBeCloseTo(0, 9);
  });

  it("returns one placement per advance, in order", () => {
    const placements = computeArcGlyphPlacements({
      advancesMm: [5, 5, 5],
      kerningsMm: [0, 0],
      radiusMm: 40,
      centerAngleDeg: 0,
      coordinateConvention: "svgYDown",
    });

    expect(placements.length).toBe(3);
    // moving right (increasing pen position) means decreasing angle
    expect(placements[0].angleDeg).toBeGreaterThan(placements[1].angleDeg);
    expect(placements[1].angleDeg).toBeGreaterThan(placements[2].angleDeg);
  });

  // "inward" is for text along the bottom of a circle, still read left to right.
  it("with orientation inward, increases the angle as pen position increases: the opposite of outward's decrease", () => {
    const placements = computeArcGlyphPlacements({
      advancesMm: [5, 5, 5],
      kerningsMm: [0, 0],
      radiusMm: 40,
      centerAngleDeg: 270,
      coordinateConvention: "mathYUp",
      orientation: "inward",
    });

    expect(placements[0].angleDeg).toBeLessThan(placements[1].angleDeg);
    expect(placements[1].angleDeg).toBeLessThan(placements[2].angleDeg);
  });

  it("rotates glyphs to point toward the center (angleDeg + 90 in mathYUp) when orientation is inward", () => {
    const [placement] = computeArcGlyphPlacements({
      advancesMm: [10, 20],
      kerningsMm: [5],
      radiusMm: 100,
      centerAngleDeg: 270,
      coordinateConvention: "mathYUp",
      orientation: "inward",
    });

    // Same pen/glyph-center math as "accumulates advances..." above: glyph 0's arcLength from
    // center is -12.5mm, but inward adds instead of subtracts it from the center angle.
    const expectedAngleDeg0 = 270 + (-12.5 / 100) * (180 / Math.PI);

    expect(placement.angleDeg).toBeCloseTo(expectedAngleDeg0, 9);
    expect(placement.rotationDeg).toBeCloseTo(expectedAngleDeg0 + 90, 9);
  });

  it("mirrors inward rotation the same way outward already does between mathYUp and svgYDown", () => {
    const [mathYUpPlacement] = computeArcGlyphPlacements({
      advancesMm: [10, 20],
      kerningsMm: [5],
      radiusMm: 100,
      centerAngleDeg: 270,
      coordinateConvention: "mathYUp",
      orientation: "inward",
    });
    const [svgYDownPlacement] = computeArcGlyphPlacements({
      advancesMm: [10, 20],
      kerningsMm: [5],
      radiusMm: 100,
      centerAngleDeg: 270,
      coordinateConvention: "svgYDown",
      orientation: "inward",
    });

    expect(svgYDownPlacement.rotationDeg).toBeCloseTo(
      -mathYUpPlacement.rotationDeg,
      9,
    );
  });

  it("defaults to outward orientation when omitted", () => {
    const withDefault = computeArcGlyphPlacements({
      advancesMm: [10, 20],
      kerningsMm: [5],
      radiusMm: 100,
      centerAngleDeg: 90,
      coordinateConvention: "mathYUp",
    });
    const withExplicitOutward = computeArcGlyphPlacements({
      advancesMm: [10, 20],
      kerningsMm: [5],
      radiusMm: 100,
      centerAngleDeg: 90,
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
    const placement = {
      angleDeg: 90,
      position: [10, 20] as [number, number],
      rotationDeg: 0,
      pivotOffsetMm: 0,
    };

    expect(applyArcPlacement(square, placement)).toEqual([
      [
        [10, 20],
        [11, 20],
        [11, 21],
        [10, 21],
      ],
    ]);
  });

  it("rotates a point before translating", () => {
    const point: Vec2[][] = [[[1, 0]]];
    const placement = {
      angleDeg: 0,
      position: [5, 5] as [number, number],
      rotationDeg: 90,
      pivotOffsetMm: 0,
    };

    const [[[x, y]]] = applyArcPlacement(point, placement);

    expect(x).toBeCloseTo(5, 9); // (1,0) rotated 90 deg -> (0,1), then + (5,5)
    expect(y).toBeCloseTo(6, 9);
  });

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
      rotationDeg: 90,
      pivotOffsetMm: 5,
    };

    const [[[leftX, leftY], [rightX, rightY]]] = applyArcPlacement(
      wideGlyphBaseline,
      placement,
    );

    // local x=0 is 5mm left of the pivot -> after a 90deg rotation it's 5mm "below" the pivot
    expect(leftX).toBeCloseTo(0, 9);
    expect(leftY).toBeCloseTo(-5, 9);
    // local x=10 is 5mm right of the pivot -> after a 90deg rotation it's 5mm "above" the pivot
    expect(rightX).toBeCloseTo(0, 9);
    expect(rightY).toBeCloseTo(5, 9);
  });
});
