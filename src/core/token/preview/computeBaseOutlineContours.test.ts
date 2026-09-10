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

  it("unions a growOutline contour into a disc shape's outline", async () => {
    const shape: ShapeSpec = { type: "disc", diameterMm: 40 };
    const growSquare: Vec2[][] = [
      [
        [-30, -30],
        [30, -30],
        [30, 30],
        [-30, 30],
      ],
    ];

    const contours = await computeBaseOutlineContours(shape, 90, growSquare);

    // The disc's own radius is 20mm; the grow square's own corners reach ~42.4mm from the
    // origin, so only an actual union (not floating-point noise around the plain circle) can
    // push the outline this far out.
    expect(maxDistanceFromOrigin(contours)).toBeGreaterThan(25);
  });

  it("returns the plain outline when no growOutline contours are given", async () => {
    const shape: ShapeSpec = { type: "disc", diameterMm: 40 };

    const contours = await computeBaseOutlineContours(shape, 90);

    expect(maxDistanceFromOrigin(contours)).toBeCloseTo(20, 0);
  });

  const totalArea = (contours: Vec2[][]): number => {
    return contours.reduce((sum, contour) => {
      let area = 0;

      for (let i = 0; i < contour.length; i++) {
        const [x0, y0] = contour[i];
        const [x1, y1] = contour[(i + 1) % contour.length];

        area += x0 * y1 - x1 * y0;
      }

      return sum + Math.abs(area) / 2;
    }, 0);
  };

  it("leaves the nob/ribbon junction untouched when the fillet is off", async () => {
    const withoutFillet: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      nobDiameterMm: 24,
      nobFilletEnabled: false,
      nobFilletRadiusMm: 3,
    };
    const plain: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      nobDiameterMm: 24,
    };

    const withoutFilletContours = await computeBaseOutlineContours(withoutFillet, 90);
    const plainContours = await computeBaseOutlineContours(plain, 90);

    expect(totalArea(withoutFilletContours)).toBeCloseTo(totalArea(plainContours), 1);
  });

  it("fills in the concave nob/ribbon junction when the fillet is enabled", async () => {
    const withFillet: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      nobDiameterMm: 24,
      nobFilletEnabled: true,
      nobFilletRadiusMm: 3,
    };
    const withoutFillet: ShapeSpec = { ...withFillet, nobFilletEnabled: false };

    const filletedContours = await computeBaseOutlineContours(withFillet, 90);
    const plainContours = await computeBaseOutlineContours(withoutFillet, 90);

    // Closing only ever adds material (see filletOutline.ts), so the filleted outline's area
    // is strictly larger once there's an actual notch for it to fill.
    expect(totalArea(filletedContours)).toBeGreaterThan(totalArea(plainContours));
  });
});
