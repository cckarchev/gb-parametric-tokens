import { describe, expect, it } from "vitest";

import { signedArea } from "../svg/normalizeWinding";
import { layoutFlatText } from "./layoutFlatText";
import { loadTestFont } from "./testFont";

const SIZE_MM = 6;
const TOLERANCE_MM = 0.05;
const PRECISION_DIGITS = 5;

describe("layoutFlatText", () => {
  it("produces at least one contour per non-space character", () => {
    const font = loadTestFont();

    const contours = layoutFlatText(
      font,
      { text: "12", sizeMm: SIZE_MM },
      TOLERANCE_MM,
    );

    expect(contours.length).toBeGreaterThanOrEqual(2);
  });

  it("returns an empty list for an empty string", () => {
    const font = loadTestFont();

    const contours = layoutFlatText(
      font,
      { text: "", sizeMm: SIZE_MM },
      TOLERANCE_MM,
    );

    expect(contours).toEqual([]);
  });

  it("centers the combined contours on both axes", () => {
    const font = loadTestFont();

    const contours = layoutFlatText(
      font,
      { text: "20", sizeMm: SIZE_MM },
      TOLERANCE_MM,
    );
    const xs = contours.flat().map(([x]) => x);
    const ys = contours.flat().map(([, y]) => y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    expect(centerX).toBeCloseTo(0, PRECISION_DIGITS);
    expect(centerY).toBeCloseTo(0, PRECISION_DIGITS);
  });
});

describe("layoutFlatText tracking and winding", () => {
  it("adds trackingMm as extra spacing between every adjacent pair of glyphs", () => {
    const font = loadTestFont();

    const spanOf = (contours: [number, number][][]) => {
      const xs = contours.flat().map(([x]) => x);

      return Math.max(...xs) - Math.min(...xs);
    };

    const tight = layoutFlatText(
      font,
      { text: "111", sizeMm: SIZE_MM },
      TOLERANCE_MM,
    );
    const tracked = layoutFlatText(
      font,
      { text: "111", sizeMm: SIZE_MM, trackingMm: 2 },
      TOLERANCE_MM,
    );

    expect(spanOf(tracked)).toBeGreaterThan(spanOf(tight));
  });

  it("re-normalizes winding after the y-flip, so counters stay counters", () => {
    const font = loadTestFont();

    const contours = layoutFlatText(
      font,
      { text: "0", sizeMm: SIZE_MM },
      TOLERANCE_MM,
    );
    const areasByMagnitude = contours
      .map((contour) => signedArea(contour))
      .sort((a, b) => Math.abs(b) - Math.abs(a));

    expect(areasByMagnitude.length).toBe(2);
    expect(areasByMagnitude[0]).toBeGreaterThan(0);
    expect(areasByMagnitude[1]).toBeLessThan(0);
  });
});
