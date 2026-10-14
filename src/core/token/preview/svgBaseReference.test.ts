import { describe, expect, it } from "vitest";

import { MODEL_BASE_DIAMETER_MM } from "../geometry/studPlacement";
import {
  buildBaseReferenceCircleSvg,
  CIRCLE_ANCHOR_X_SVG,
  CIRCLE_ANCHOR_Y_SVG,
  computeBaseReferenceCircleBottomYSvg,
} from "./svgBaseReference";

describe("CIRCLE_ANCHOR_X_SVG / CIRCLE_ANCHOR_Y_SVG", () => {
  it("sits exactly one radius past the circle's own edge, so the circle's local footprint starts at (0, 0)", () => {
    const radiusMm = MODEL_BASE_DIAMETER_MM / 2;

    expect(CIRCLE_ANCHOR_X_SVG).toBe(radiusMm);
    expect(CIRCLE_ANCHOR_Y_SVG).toBe(radiusMm);
  });
});

describe("buildBaseReferenceCircleSvg", () => {
  it("draws a circle at the given center with the fixed base radius", () => {
    const svg = buildBaseReferenceCircleSvg(CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG);

    expect(svg).toContain('data-role="base-reference-circle"');
    expect(svg).toContain(`cx="${CIRCLE_ANCHOR_X_SVG}"`);
    expect(svg).toContain(`cy="${CIRCLE_ANCHOR_Y_SVG}"`);
    expect(svg).toContain(`r="${MODEL_BASE_DIAMETER_MM / 2}"`);
  });
});

describe("computeBaseReferenceCircleBottomYSvg", () => {
  it("is the center plus the fixed radius", () => {
    expect(computeBaseReferenceCircleBottomYSvg(CIRCLE_ANCHOR_Y_SVG)).toBe(
      CIRCLE_ANCHOR_Y_SVG + MODEL_BASE_DIAMETER_MM / 2,
    );
  });
});
