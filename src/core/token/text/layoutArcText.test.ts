import { describe, expect, it } from "vitest";

import { signedArea } from "../svg/normalizeWinding";
import { layoutArcText } from "./layoutArcText";
import { loadTestFont } from "./testFont";

describe("layoutArcText", () => {
  it("produces at least one contour per non-space character", () => {
    const font = loadTestFont();

    const contours = layoutArcText(
      font,
      { text: "Impetus", sizeMm: 5, radiusMm: 20 },
      0.05,
      "svgYDown",
    );

    expect(contours.length).toBeGreaterThanOrEqual(7);
  });

  it("places all points within a plausible ring around the radius", () => {
    const font = loadTestFont();
    const radiusMm = 20;

    const contours = layoutArcText(
      font,
      { text: "Impetus", sizeMm: 5, radiusMm },
      0.05,
      "svgYDown",
    );

    const distances = contours.flat().map(([x, y]) => Math.hypot(x, y));
    const maxGlyphSpanMm = 10; // generous: sizeMm 5 plus ascender/descender headroom

    for (const distance of distances) {
      expect(distance).toBeGreaterThan(radiusMm - maxGlyphSpanMm);
      expect(distance).toBeLessThan(radiusMm + maxGlyphSpanMm);
    }
  });

  it("handles the SPEC-flagged worst case string without throwing", () => {
    const font = loadTestFont();

    const contours = layoutArcText(
      font,
      { text: "Superior Strategy", sizeMm: 5, radiusMm: 20 },
      0.05,
      "svgYDown",
    );

    expect(contours.length).toBeGreaterThan(0);
  });

  it("skips glyphs with zero advance width and no outline, like the space character", () => {
    const font = loadTestFont();

    const withSpace = layoutArcText(
      font,
      { text: "a a", sizeMm: 5, radiusMm: 20 },
      0.05,
      "svgYDown",
    );
    const withoutSpace = layoutArcText(
      font,
      { text: "aa", sizeMm: 5, radiusMm: 20 },
      0.05,
      "svgYDown",
    );

    expect(withSpace.length).toBe(withoutSpace.length);
  });

  it("still advances the pen past a space, so words do not collide", () => {
    const font = loadTestFont();

    const computeAngularSpanDeg = (contours: [number, number][][]): number => {
      const angles = contours
        .flat()
        .map(([x, y]) => Math.atan2(y, x) * (180 / Math.PI));
      return Math.max(...angles) - Math.min(...angles);
    };

    const withSpace = layoutArcText(
      font,
      { text: "a a", sizeMm: 5, radiusMm: 20 },
      0.05,
      "svgYDown",
    );
    const withoutSpace = layoutArcText(
      font,
      { text: "aa", sizeMm: 5, radiusMm: 20 },
      0.05,
      "svgYDown",
    );

    expect(computeAngularSpanDeg(withSpace)).toBeGreaterThan(
      computeAngularSpanDeg(withoutSpace),
    );
  });

  it("adds trackingMm as extra spacing between every adjacent pair of glyphs", () => {
    const font = loadTestFont();

    const computeAngularSpanDeg = (contours: [number, number][][]): number => {
      const angles = contours
        .flat()
        .map(([x, y]) => Math.atan2(y, x) * (180 / Math.PI));
      return Math.max(...angles) - Math.min(...angles);
    };

    const tight = layoutArcText(
      font,
      { text: "aaa", sizeMm: 5, radiusMm: 20 },
      0.05,
      "svgYDown",
    );
    const tracked = layoutArcText(
      font,
      { text: "aaa", sizeMm: 5, radiusMm: 20, trackingMm: 2 },
      0.05,
      "svgYDown",
    );

    expect(computeAngularSpanDeg(tracked)).toBeGreaterThan(
      computeAngularSpanDeg(tight),
    );
  });

  // Glyph outlines come y-down, so mathYUp has to flip them before placing them. Without the flip,
  // an "L" at radius 37.5 grows inward instead of reaching past 37.5.
  const RADIUS_MM = 37.5;
  const SIZE_MM = 6;
  const MIN_ASCENDER_REACH_MM = 3; // Saira Condensed Bold's cap height at 6mm (~4.1mm) is comfortably above this
  const BASELINE_TOLERANCE_MM = 0.1; // flattening/optical overshoot can dip a hair below the baseline

  const measureRadialExtent = (contours: [number, number][][]) => {
    const distances = contours.flat().map(([x, y]) => Math.hypot(x, y));

    return { min: Math.min(...distances), max: Math.max(...distances) };
  };

  it("grows an ascender outward from the arc's center in mathYUp space", () => {
    const font = loadTestFont();

    const contours = layoutArcText(
      font,
      { text: "L", sizeMm: SIZE_MM, radiusMm: RADIUS_MM, centerAngleDeg: 90 },
      0.05,
      "mathYUp",
    );
    const extent = measureRadialExtent(contours);

    expect(extent.max).toBeGreaterThan(RADIUS_MM + MIN_ASCENDER_REACH_MM);
    expect(extent.min).toBeGreaterThan(RADIUS_MM - BASELINE_TOLERANCE_MM);
  });

  it("grows an ascender outward in svgYDown space too, the untouched path", () => {
    const font = loadTestFont();

    const contours = layoutArcText(
      font,
      { text: "L", sizeMm: SIZE_MM, radiusMm: RADIUS_MM, centerAngleDeg: 90 },
      0.05,
      "svgYDown",
    );
    const extent = measureRadialExtent(contours);

    expect(extent.max).toBeGreaterThan(RADIUS_MM + MIN_ASCENDER_REACH_MM);
    expect(extent.min).toBeGreaterThan(RADIUS_MM - BASELINE_TOLERANCE_MM);
  });

  it("grows an ascender inward, toward the arc's center, when orientation is inward", () => {
    const font = loadTestFont();

    const contours = layoutArcText(
      font,
      {
        text: "L",
        sizeMm: SIZE_MM,
        radiusMm: RADIUS_MM,
        centerAngleDeg: 270,
        orientation: "inward",
      },
      0.05,
      "mathYUp",
    );
    const extent = measureRadialExtent(contours);
    // Mirrors BASELINE_TOLERANCE_MM's role for the outward case above, just loosened slightly:
    // this inward baseline sits on the opposite side of the same optical-overshoot effect.
    const INWARD_BASELINE_TOLERANCE_MM = 0.15;

    expect(extent.min).toBeLessThan(RADIUS_MM - MIN_ASCENDER_REACH_MM);
    expect(extent.max).toBeLessThan(RADIUS_MM + INWARD_BASELINE_TOLERANCE_MM);
  });

  // "o" is one outer contour plus one counter. A y-flip reverses both windings, so if
  // normalizeWinding did not re-run after the flip the outer contour would come back
  // clockwise and the counter counter-clockwise, and the "Positive" fill rule would drop
  // the glyph or fill its hole.
  it("re-normalizes winding after the mathYUp flip, so counters stay counters", () => {
    const font = loadTestFont();

    const contours = layoutArcText(
      font,
      { text: "o", sizeMm: SIZE_MM, radiusMm: RADIUS_MM, centerAngleDeg: 90 },
      0.05,
      "mathYUp",
    );
    const areasByMagnitude = contours
      .map((contour) => signedArea(contour))
      .sort((a, b) => Math.abs(b) - Math.abs(a));

    expect(areasByMagnitude.length).toBe(2);
    expect(areasByMagnitude[0]).toBeGreaterThan(0);
    expect(areasByMagnitude[1]).toBeLessThan(0);
  });
});
