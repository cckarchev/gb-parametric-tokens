import { describe, expect, it } from "vitest";

import {
  CENTER_ANGLE_DEG,
  DEGREES_PER_RADIAN,
} from "../geometry/angleConventions";
import {
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeSweepDeg,
} from "../geometry/studPlacement";
import { buildArcRibbon } from "./buildArcRibbon";

const shape = {
  type: "arc" as const,
  ribbonWidthMm: 15,
  ribbonLengthMm: 20,
  studDiameterMm: 24,
};

const HEIGHT_MM = 3;
const PRECISION_DIGITS = 9;
// The ring sector is a polygon, so its edges can sit a little off the true circle.
const SEGMENT_SLACK_MM = 0.5;
const TOP_SLACK_MM = 0.1;

describe("buildArcRibbon", () => {
  it("extrudes a ring sector resting on the XY plane, up to heightMm", async () => {
    const manifold = await buildArcRibbon(shape, CENTER_ANGLE_DEG, HEIGHT_MM);
    const bounds = manifold.boundingBox();

    expect(manifold.status()).toBe("NoError");
    expect(bounds.min[2]).toBeCloseTo(0, PRECISION_DIGITS);
    expect(bounds.max[2]).toBeCloseTo(HEIGHT_MM, PRECISION_DIGITS);
  });

  it("stays within the ring's outer radius on every axis", async () => {
    // Checked per-axis, not via bounding-box corners: a corner can combine the maxX
    // reached at one sweep edge with the maxY reached at the opposite edge, which is a
    // point outside the actual sector even though both individual axis bounds are fine.
    const manifold = await buildArcRibbon(shape, CENTER_ANGLE_DEG, HEIGHT_MM);
    const bounds = manifold.boundingBox();
    const outerRadiusMm = computeOuterRadiusMm(shape);

    expect(Math.abs(bounds.min[0])).toBeLessThanOrEqual(
      outerRadiusMm + SEGMENT_SLACK_MM,
    );
    expect(Math.abs(bounds.max[0])).toBeLessThanOrEqual(
      outerRadiusMm + SEGMENT_SLACK_MM,
    );
    expect(Math.abs(bounds.min[1])).toBeLessThanOrEqual(
      outerRadiusMm + SEGMENT_SLACK_MM,
    );
    expect(Math.abs(bounds.max[1])).toBeLessThanOrEqual(
      outerRadiusMm + SEGMENT_SLACK_MM,
    );
  });

  it("does not enclose the origin: it's a ring segment centered at the top, not a full disc", async () => {
    const manifold = await buildArcRibbon(shape, CENTER_ANGLE_DEG, HEIGHT_MM);
    const bounds = manifold.boundingBox();
    const innerRadiusMm = computeInnerRadiusMm();
    const outerRadiusMm = computeOuterRadiusMm(shape);
    const halfSweepDeg = computeSweepDeg(shape) / 2;
    const startAngleDeg = CENTER_ANGLE_DEG - halfSweepDeg;

    // The inner radius is fixed, so the lowest y is innerRadiusMm * sin(startAngleDeg).
    const expectedMinY =
      innerRadiusMm * Math.sin(startAngleDeg / DEGREES_PER_RADIAN);

    expect(bounds.min[1]).toBeCloseTo(expectedMinY, 1);
    // the highest y is at the center (90deg), y = outerRadiusMm * sin(90deg) = outerRadiusMm
    expect(bounds.max[1]).toBeGreaterThan(outerRadiusMm - 1);
    expect(bounds.max[1]).toBeLessThanOrEqual(outerRadiusMm + TOP_SLACK_MM);
  });
});
