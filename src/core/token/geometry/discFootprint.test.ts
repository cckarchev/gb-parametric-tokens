import { describe, expect, it } from "vitest";

import { getManifoldModule } from "../mesh/manifoldModule";
import type { CrowfootSpec } from "../types";
import { buildDiscFootprint } from "./discFootprint";

const OUTER_DIAMETER_MM = 40;
const INNER_DIAMETER_MM = 30;
// BODY_CIRCLE_SEGMENTS polygons sit slightly inside the true circle, so areas are compared
// loosely rather than to many decimals.
const AREA_TOLERANCE_RATIO = 0.01;

const circleArea = (diameterMm: number): number => {
  const radiusMm = diameterMm / 2;

  return Math.PI * radiusMm * radiusMm;
};

const relativeError = (actual: number, expected: number): number =>
  Math.abs(actual - expected) / expected;

describe("buildDiscFootprint", () => {
  it("is a full circle when the disc has no inner diameter", async () => {
    const { CrossSection } = await getManifoldModule();

    const footprint = buildDiscFootprint(CrossSection, {
      type: "disc",
      diameterMm: OUTER_DIAMETER_MM,
    });
    const expectedArea = circleArea(OUTER_DIAMETER_MM);

    expect(relativeError(footprint.area(), expectedArea)).toBeLessThan(
      AREA_TOLERANCE_RATIO,
    );
  });

  it("is a ring when the disc has an inner diameter", async () => {
    const { CrossSection } = await getManifoldModule();

    const footprint = buildDiscFootprint(CrossSection, {
      type: "disc",
      diameterMm: OUTER_DIAMETER_MM,
      innerDiameterMm: INNER_DIAMETER_MM,
    });
    const expectedArea =
      circleArea(OUTER_DIAMETER_MM) - circleArea(INNER_DIAMETER_MM);

    expect(relativeError(footprint.area(), expectedArea)).toBeLessThan(
      AREA_TOLERANCE_RATIO,
    );
  });
});

const CROWFOOT_OUTER_DIAMETER_MM = 76.2;
const CROWFOOT_INNER_DIAMETER_MM = 64.2;
const CROWFOOT_SPOKE_WIDTH_MM = 5;
const CROWFOOT_ARC_SWEEP_DEG = 30;
const CROWFOOT_SPOKE_COUNT = 3;
const CROWFOOT_CORNER_RADIUS_MM = 1.5;
const CROWFOOT_FILLET_RADIUS_MM = 3;
// Half the probe square's side: small enough to sit cleanly on either side of an edge.
const PROBE_HALF_SIZE_MM = 0.1;
// Radius halfway across the band, where the arcs live.
const BAND_MID_RADIUS_MM =
  (CROWFOOT_OUTER_DIAMETER_MM + CROWFOOT_INNER_DIAMETER_MM) / 4;
const DEGREES_TO_RADIANS = Math.PI / 180;
// Float noise from the polygon math, far below anything printable.
const BOUNDS_EPSILON_MM = 1e-6;

const pointAtAngle = (radiusMm: number, angleDeg: number): [number, number] => {
  const angleRad = angleDeg * DEGREES_TO_RADIANS;

  return [Math.cos(angleRad) * radiusMm, Math.sin(angleRad) * radiusMm];
};

describe("buildDiscFootprint, crowfoot", () => {
  const buildCrowfoot = async (overrides: Partial<CrowfootSpec> = {}) => {
    const { CrossSection } = await getManifoldModule();
    const footprint = buildDiscFootprint(CrossSection, {
      type: "disc",
      diameterMm: CROWFOOT_OUTER_DIAMETER_MM,
      innerDiameterMm: CROWFOOT_INNER_DIAMETER_MM,
      crowfoot: {
        spokeCount: CROWFOOT_SPOKE_COUNT,
        spokeWidthMm: CROWFOOT_SPOKE_WIDTH_MM,
        arcSweepDeg: CROWFOOT_ARC_SWEEP_DEG,
        cornerRadiusMm: CROWFOOT_CORNER_RADIUS_MM,
        filletRadiusMm: CROWFOOT_FILLET_RADIUS_MM,
        ...overrides,
      },
    });

    const isSolidAt = ([x, y]: [number, number]): boolean => {
      const probe = CrossSection.square(
        [PROBE_HALF_SIZE_MM * 2, PROBE_HALF_SIZE_MM * 2],
        true,
      );
      const overlap = footprint.intersect(probe.translate([x, y]));

      return overlap.area() > 0;
    };

    return { footprint, isSolidAt };
  };

  it("keeps a short arc of the band at the end of the upward spoke and at the other two", async () => {
    const { isSolidAt } = await buildCrowfoot();

    expect(isSolidAt(pointAtAngle(BAND_MID_RADIUS_MM, 90))).toBe(true);
    expect(isSolidAt(pointAtAngle(BAND_MID_RADIUS_MM, 210))).toBe(true);
    expect(isSolidAt(pointAtAngle(BAND_MID_RADIUS_MM, 330))).toBe(true);
  });

  it("cuts the band away outside each arc's sweep", async () => {
    const { isSolidAt } = await buildCrowfoot();
    const halfSweepDeg = CROWFOOT_ARC_SWEEP_DEG / 2;
    const marginDeg = 1;

    expect(
      isSolidAt(
        pointAtAngle(BAND_MID_RADIUS_MM, 90 + halfSweepDeg - marginDeg),
      ),
    ).toBe(true);
    expect(
      isSolidAt(
        pointAtAngle(BAND_MID_RADIUS_MM, 90 + halfSweepDeg + marginDeg),
      ),
    ).toBe(false);
    expect(isSolidAt(pointAtAngle(BAND_MID_RADIUS_MM, 270))).toBe(false);
  });

  it("joins the arcs at the center with spokes of the given width and no hub", async () => {
    const { isSolidAt } = await buildCrowfoot();
    const halfWidthMm = CROWFOOT_SPOKE_WIDTH_MM / 2;
    const alongSpokeMm = 15;
    const marginMm = 0.5;

    expect(isSolidAt([0, 0])).toBe(true);
    expect(isSolidAt([halfWidthMm - marginMm, alongSpokeMm])).toBe(true);
    expect(isSolidAt([halfWidthMm + marginMm, alongSpokeMm])).toBe(false);
    expect(isSolidAt(pointAtAngle(alongSpokeMm, 270))).toBe(false);
  });

  it("rounds the corners at each arc's ends", async () => {
    const { isSolidAt } = await buildCrowfoot();
    const outerRadiusMm = CROWFOOT_OUTER_DIAMETER_MM / 2;
    const halfSweepDeg = CROWFOOT_ARC_SWEEP_DEG / 2;
    // Just inside the arc's sharp outer corner: solid on a square end, cut on a rounded one.
    const insetMm = 0.3;
    const insetDeg = 0.5;
    const nearCorner = pointAtAngle(
      outerRadiusMm - insetMm,
      90 + halfSweepDeg - insetDeg,
    );
    // Mid-band at the same angle stays solid: rounding only takes the corner.
    const midBandNearEnd = pointAtAngle(
      BAND_MID_RADIUS_MM,
      90 + halfSweepDeg - insetDeg,
    );

    expect(isSolidAt(nearCorner)).toBe(false);
    expect(isSolidAt(midBandNearEnd)).toBe(true);
  });

  it("fills the corner where a spoke meets its arc with a fillet", async () => {
    const { isSolidAt } = await buildCrowfoot();
    const innerRadiusMm = CROWFOOT_INNER_DIAMETER_MM / 2;
    const halfWidthMm = CROWFOOT_SPOKE_WIDTH_MM / 2;
    // Just outside the sharp corner between the upward spoke's side and the arc's inner edge.
    const offsetMm = 0.4;
    const beside = halfWidthMm + offsetMm;
    const nearCorner: [number, number] = [
      beside,
      Math.sqrt(innerRadiusMm ** 2 - beside ** 2) - offsetMm,
    ];

    expect(isSolidAt(nearCorner)).toBe(true);
  });

  it("fills the corners between neighboring spokes at the center with a fillet", async () => {
    const { isSolidAt } = await buildCrowfoot();
    const halfWidthMm = CROWFOOT_SPOKE_WIDTH_MM / 2;
    const halfSpokeGapDeg = 60;
    // The sharp corner where the upward and lower left spokes' sides meet lies on the bisector
    // between them; a point just past it is empty on a sharp corner, solid on a filleted one.
    const sharpCornerDistanceMm =
      halfWidthMm / Math.sin(halfSpokeGapDeg * DEGREES_TO_RADIANS);
    const pastCornerMm = 0.3;
    const bisectorAngleDeg = 150;

    expect(
      isSolidAt(
        pointAtAngle(sharpCornerDistanceMm + pastCornerMm, bisectorAngleDeg),
      ),
    ).toBe(true);
  });

  it("leaves the corners between spokes sharp when the fillet radius is 0", async () => {
    const { isSolidAt } = await buildCrowfoot({ filletRadiusMm: 0 });
    const halfWidthMm = CROWFOOT_SPOKE_WIDTH_MM / 2;
    const halfSpokeGapDeg = 60;
    const sharpCornerDistanceMm =
      halfWidthMm / Math.sin(halfSpokeGapDeg * DEGREES_TO_RADIANS);
    const pastCornerMm = 0.3;
    const bisectorAngleDeg = 150;

    expect(
      isSolidAt(
        pointAtAngle(sharpCornerDistanceMm + pastCornerMm, bisectorAngleDeg),
      ),
    ).toBe(false);
  });

  it("keeps the arcs' ends square when the corner radius is 0", async () => {
    const { footprint } = await buildCrowfoot({
      cornerRadiusMm: 0,
      filletRadiusMm: 0,
    });

    expect(footprint.isEmpty()).toBe(false);
  });

  it("spaces any number of spokes evenly, the first pointing up", async () => {
    const { isSolidAt } = await buildCrowfoot({ spokeCount: 4 });

    for (const angleDeg of [90, 180, 270, 0]) {
      expect(isSolidAt(pointAtAngle(BAND_MID_RADIUS_MM, angleDeg))).toBe(true);
    }

    expect(isSolidAt(pointAtAngle(BAND_MID_RADIUS_MM, 45))).toBe(false);
  });

  it("never reaches past the AOE's outer radius", async () => {
    const { footprint } = await buildCrowfoot();
    const bounds = footprint.bounds();
    const outerRadiusMm = CROWFOOT_OUTER_DIAMETER_MM / 2;

    expect(bounds.max[1]).toBeLessThanOrEqual(
      outerRadiusMm + BOUNDS_EPSILON_MM,
    );
    expect(bounds.min[1]).toBeGreaterThan(-outerRadiusMm);
  });
});
