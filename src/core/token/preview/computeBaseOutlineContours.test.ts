import { describe, expect, it } from "vitest";

import { CENTER_ANGLE_DEG } from "../geometry/angleConventions";
import {
  computeEffectiveStudDiameterMm,
  computeOuterRadiusMm,
} from "../geometry/studPlacement";
import type { ShapeSpec, Vec2 } from "../types";
import { computeBaseOutlineContours } from "./computeBaseOutlineContours";

const DISC_DIAMETER_MM = 40;
const STUD_FILLET_RADIUS_MM = 3;
const DISC_RADIUS_MM = DISC_DIAMETER_MM / 2;
// The outlines are polygons: a vertex can sit a hair outside the true circle, an edge well inside.
const OUTSIDE_SLACK_MM = 0.1;
const INSIDE_SLACK_MM = 0.5;

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

const totalArea = (contours: Vec2[][]): number =>
  contours.reduce((sum, contour) => {
    let area = 0;

    for (let i = 0; i < contour.length; i++) {
      const [x0, y0] = contour[i];
      const [x1, y1] = contour[(i + 1) % contour.length];

      area += x0 * y1 - x1 * y0;
    }

    return sum + Math.abs(area) / 2;
  }, 0);

describe("computeBaseOutlineContours", () => {
  it("returns a circle contour sized to the diameter for a disc shape", async () => {
    const shape: ShapeSpec = { type: "disc", diameterMm: DISC_DIAMETER_MM };

    const contours = await computeBaseOutlineContours(shape, CENTER_ANGLE_DEG);
    const bounds = boundsOf(contours);

    const outerLimitMm = DISC_RADIUS_MM + OUTSIDE_SLACK_MM;
    const innerLimitMm = DISC_RADIUS_MM - INSIDE_SLACK_MM;

    for (const axis of [0, 1]) {
      expect(bounds.min[axis]).toBeGreaterThanOrEqual(-outerLimitMm);
      expect(bounds.min[axis]).toBeLessThan(-innerLimitMm);
      expect(bounds.max[axis]).toBeLessThanOrEqual(outerLimitMm);
      expect(bounds.max[axis]).toBeGreaterThan(innerLimitMm);
    }
  });

  it("returns a ring sector with two stud bumps for an arc shape", async () => {
    const shape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 24,
    };

    const contours = await computeBaseOutlineContours(shape, CENTER_ANGLE_DEG);
    const bounds = boundsOf(contours);
    const farthest = maxDistanceFromOrigin(contours);
    const studRadiusMm = computeEffectiveStudDiameterMm(shape) / 2;
    const outerRadiusMm = computeOuterRadiusMm(shape);

    // The ribbon alone reaches outerRadiusMm. Anything farther is a stud, so the studs are in the
    // outline.
    expect(farthest).toBeGreaterThan(outerRadiusMm);
    expect(farthest).toBeLessThanOrEqual(
      outerRadiusMm + studRadiusMm + INSIDE_SLACK_MM,
    );

    // A sweep well under 180deg, centered at 90deg, keeps the whole sector in the upper
    // half-plane, so it never encloses the origin.
    expect(bounds.min[1]).toBeGreaterThan(0);
  });
});

describe("computeBaseOutlineContours grow outline", () => {
  it("unions a growOutline contour into a disc shape's outline", async () => {
    const shape: ShapeSpec = { type: "disc", diameterMm: DISC_DIAMETER_MM };
    const growHalfMm = 30;
    const growSquare: Vec2[][] = [
      [
        [-growHalfMm, -growHalfMm],
        [growHalfMm, -growHalfMm],
        [growHalfMm, growHalfMm],
        [-growHalfMm, growHalfMm],
      ],
    ];
    const wellPastDiscMm = 25;

    const contours = await computeBaseOutlineContours(
      shape,
      CENTER_ANGLE_DEG,
      growSquare,
    );

    // The disc's own radius is 20mm; the grow square's own corners reach ~42.4mm from the
    // origin, so only an actual union (not floating-point noise around the plain circle) can
    // push the outline this far out.
    expect(maxDistanceFromOrigin(contours)).toBeGreaterThan(wellPastDiscMm);
  });

  it("returns the plain outline when no growOutline contours are given", async () => {
    const shape: ShapeSpec = { type: "disc", diameterMm: DISC_DIAMETER_MM };

    const contours = await computeBaseOutlineContours(shape, CENTER_ANGLE_DEG);

    expect(maxDistanceFromOrigin(contours)).toBeCloseTo(DISC_RADIUS_MM, 0);
  });
});

describe("computeBaseOutlineContours fillet off", () => {
  it("leaves the stud/ribbon junction untouched when the fillet is off", async () => {
    const withoutFillet: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 24,
      studFilletEnabled: false,
      studFilletRadiusMm: STUD_FILLET_RADIUS_MM,
    };
    const plain: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 24,
    };

    const withoutFilletContours = await computeBaseOutlineContours(
      withoutFillet,
      CENTER_ANGLE_DEG,
    );
    const plainContours = await computeBaseOutlineContours(
      plain,
      CENTER_ANGLE_DEG,
    );

    expect(totalArea(withoutFilletContours)).toBeCloseTo(
      totalArea(plainContours),
      1,
    );
  });
});

describe("computeBaseOutlineContours fillet on and inner diameter", () => {
  it("fills in the concave stud/ribbon junction when the fillet is enabled", async () => {
    const withFillet: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 24,
      studFilletEnabled: true,
      studFilletRadiusMm: STUD_FILLET_RADIUS_MM,
    };
    const withoutFillet: ShapeSpec = {
      ...withFillet,
      studFilletEnabled: false,
    };

    const filletedContours = await computeBaseOutlineContours(
      withFillet,
      CENTER_ANGLE_DEG,
    );
    const plainContours = await computeBaseOutlineContours(
      withoutFillet,
      CENTER_ANGLE_DEG,
    );

    // Closing only ever adds material (see filletOutline.ts), so the filleted outline's area
    // is strictly larger once there's an actual notch for it to fill.
    expect(totalArea(filletedContours)).toBeGreaterThan(
      totalArea(plainContours),
    );
  });

  it("returns an outer and an inner contour for a disc with an inner diameter", async () => {
    const innerRadiusMm = 15;
    const shape: ShapeSpec = {
      type: "disc",
      diameterMm: DISC_DIAMETER_MM,
      innerDiameterMm: innerRadiusMm * 2,
    };

    const contours = await computeBaseOutlineContours(shape, CENTER_ANGLE_DEG);
    const farthestDistances = contours.map((contour) =>
      maxDistanceFromOrigin([contour]),
    );
    const innerContours = farthestDistances.filter(
      (distance) => distance < innerRadiusMm + OUTSIDE_SLACK_MM,
    );

    expect(contours).toHaveLength(2);
    expect(innerContours).toHaveLength(1);
  });
});
