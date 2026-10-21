import { describe, expect, it } from "vitest";

import { signedArea } from "../svg/normalizeWinding";
import { layoutFlatText } from "./layoutFlatText";
import { loadTestFont } from "./testFont";

describe("layoutFlatText", () => {
  it("produces at least one contour per non-space character", () => {
    const font = loadTestFont();

    const contours = layoutFlatText(font, { text: "12", sizeMm: 6 }, 0.05);

    expect(contours.length).toBeGreaterThanOrEqual(2);
  });

  it("returns an empty list for an empty string", () => {
    const font = loadTestFont();

    const contours = layoutFlatText(font, { text: "", sizeMm: 6 }, 0.05);

    expect(contours).toEqual([]);
  });

  it("centers the combined contours on both axes", () => {
    const font = loadTestFont();

    const contours = layoutFlatText(font, { text: "20", sizeMm: 6 }, 0.05);
    const xs = contours.flat().map(([x]) => x);
    const ys = contours.flat().map(([, y]) => y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    expect(centerX).toBeCloseTo(0, 5);
    expect(centerY).toBeCloseTo(0, 5);
  });

  it("adds trackingMm as extra spacing between every adjacent pair of glyphs", () => {
    const font = loadTestFont();

    const spanOf = (contours: [number, number][][]) => {
      const xs = contours.flat().map(([x]) => x);

      return Math.max(...xs) - Math.min(...xs);
    };

    const tight = layoutFlatText(font, { text: "111", sizeMm: 6 }, 0.05);
    const tracked = layoutFlatText(
      font,
      { text: "111", sizeMm: 6, trackingMm: 2 },
      0.05,
    );

    expect(spanOf(tracked)).toBeGreaterThan(spanOf(tight));
  });

  it("re-normalizes winding after the y-flip, so counters stay counters", () => {
    const font = loadTestFont();

    const contours = layoutFlatText(font, { text: "0", sizeMm: 6 }, 0.05);
    const areasByMagnitude = contours
      .map((contour) => signedArea(contour))
      .sort((a, b) => Math.abs(b) - Math.abs(a));

    expect(areasByMagnitude.length).toBe(2);
    expect(areasByMagnitude[0]).toBeGreaterThan(0);
    expect(areasByMagnitude[1]).toBeLessThan(0);
  });
});
