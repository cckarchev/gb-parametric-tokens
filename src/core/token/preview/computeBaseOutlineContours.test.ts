import { describe, expect, it } from "vitest";

import { computeEffectiveNobDiameterMm, computeOuterRadiusMm } from "../geometry/nobPlacement";
import { ShapeSpec, Vec2 } from "../types";
import { computeBaseOutlineContours } from "./computeBaseOutlineContours";

const boundsOf = (contours: Vec2[][]): { min: Vec2; max: Vec2 } => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const contour of contours) {
    for (const [x, y] of contour) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { min: [minX, minY], max: [maxX, maxY] };
};

const maxDistanceFromOrigin = (contours: Vec2[][]): number => {
  let farthest = 0;

  for (const contour of contours) {
    for (const [x, y] of contour) {
      farthest = Math.max(farthest, Math.hypot(x, y));
    }
  }

  return farthest;
};

describe("computeBaseOutlineContours", () => {
  it("returns a circle contour sized to the diameter for a disc shape", async () => {
    const shape: ShapeSpec = { type: "disc", diameterMm: 40 };

    const contours = await computeBaseOutlineContours(shape, 90);
    const bounds = boundsOf(contours);

    expect(bounds.min[0]).toBeGreaterThanOrEqual(-20.1);
    expect(bounds.min[0]).toBeLessThan(-19.5);
    expect(bounds.max[0]).toBeLessThanOrEqual(20.1);
    expect(bounds.max[0]).toBeGreaterThan(19.5);
    expect(bounds.min[1]).toBeGreaterThanOrEqual(-20.1);
    expect(bounds.min[1]).toBeLessThan(-19.5);
    expect(bounds.max[1]).toBeLessThanOrEqual(20.1);
    expect(bounds.max[1]).toBeGreaterThan(19.5);
  });

  it("returns a ring sector with two nob bumps for an arc shape", async () => {
    const shape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      nobDiameterMm: 24,
    };

    const contours = await computeBaseOutlineContours(shape, 90);
    const bounds = boundsOf(contours);
    const farthest = maxDistanceFromOrigin(contours);
    const nobRadiusMm = computeEffectiveNobDiameterMm(shape) / 2;
    const outerRadiusMm = computeOuterRadiusMm(shape);

    // Each nob's center sits nobRadiusMm past the ribbon's own inner-edge vertex (see
    // nobPlacement.ts), further out than outerRadiusMm, so its farthest point from the origin,
    // radially outward, lands past outerRadiusMm + nobRadiusMm's own straight-line distance. A
    // plain ring without nobs would only reach outerRadiusMm, so this proves the nobs are
    // actually unioned into the outline.
    expect(farthest).toBeGreaterThan(outerRadiusMm);
    expect(farthest).toBeLessThanOrEqual(outerRadiusMm + nobRadiusMm + 0.5);

    // A sweep well under 180deg, centered at 90deg, keeps the whole sector in the upper
    // half-plane, so it never encloses the origin.
    expect(bounds.min[1]).toBeGreaterThan(0);
  });
});
