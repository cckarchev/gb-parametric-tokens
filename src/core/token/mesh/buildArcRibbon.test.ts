import { describe, expect, it } from "vitest";

import {
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeSweepDeg,
} from "../geometry/nobPlacement";
import { buildArcRibbon } from "./buildArcRibbon";

const shape = { type: "arc" as const, ribbonWidthMm: 15, ribbonLengthMm: 20, nobDiameterMm: 24 };

describe("buildArcRibbon", () => {
  it("extrudes a ring sector resting on the XY plane, up to heightMm", async () => {
    const manifold = await buildArcRibbon(shape, 90, 3);
    const bounds = manifold.boundingBox();

    expect(manifold.status()).toBe("NoError");
    expect(bounds.min[2]).toBeCloseTo(0, 9);
    expect(bounds.max[2]).toBeCloseTo(3, 9);
  });

  it("stays within the ring's outer radius on every axis", async () => {
    // Checked per-axis, not via bounding-box corners: a corner can combine the maxX
    // reached at one sweep edge with the maxY reached at the opposite edge, which is a
    // point outside the actual sector even though both individual axis bounds are fine.
    const manifold = await buildArcRibbon(shape, 90, 3);
    const bounds = manifold.boundingBox();
    const outerRadiusMm = computeOuterRadiusMm(shape);

    expect(Math.abs(bounds.min[0])).toBeLessThanOrEqual(outerRadiusMm + 0.5);
    expect(Math.abs(bounds.max[0])).toBeLessThanOrEqual(outerRadiusMm + 0.5);
    expect(Math.abs(bounds.min[1])).toBeLessThanOrEqual(outerRadiusMm + 0.5);
    expect(Math.abs(bounds.max[1])).toBeLessThanOrEqual(outerRadiusMm + 0.5);
  });

  it("does not enclose the origin -- it's a ring segment centered at the top, not a full disc", async () => {
    const manifold = await buildArcRibbon(shape, 90, 3);
    const bounds = manifold.boundingBox();
    const innerRadiusMm = computeInnerRadiusMm();
    const outerRadiusMm = computeOuterRadiusMm(shape);
    const halfSweepDeg = computeSweepDeg(shape) / 2;
    const startAngleDeg = 90 - halfSweepDeg;

    // The ribbon's own inner radius is fixed (no more nob-tangent clamp), so the lowest y in
    // the sweep is simply innerRadiusMm * sin(startAngleDeg).
    const expectedMinY = innerRadiusMm * Math.sin((startAngleDeg * Math.PI) / 180);

    expect(bounds.min[1]).toBeCloseTo(expectedMinY, 1);
    // the highest y is at the center (90deg), y = outerRadiusMm * sin(90deg) = outerRadiusMm
    expect(bounds.max[1]).toBeGreaterThan(outerRadiusMm - 1);
    expect(bounds.max[1]).toBeLessThanOrEqual(outerRadiusMm + 0.1);
  });
});
