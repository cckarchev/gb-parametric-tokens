import { describe, expect, it } from "vitest";

import { getManifoldModule } from "../mesh/manifoldModule";
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

const relativeError = (actual: number, expected: number): number => {
  return Math.abs(actual - expected) / expected;
};

describe("buildDiscFootprint", () => {
  it("is a full circle when the disc has no inner diameter", async () => {
    const { CrossSection } = await getManifoldModule();

    const footprint = buildDiscFootprint(CrossSection, {
      type: "disc",
      diameterMm: OUTER_DIAMETER_MM,
    });
    const expectedArea = circleArea(OUTER_DIAMETER_MM);

    expect(relativeError(footprint.area(), expectedArea)).toBeLessThan(AREA_TOLERANCE_RATIO);
  });

  it("is a ring when the disc has an inner diameter", async () => {
    const { CrossSection } = await getManifoldModule();

    const footprint = buildDiscFootprint(CrossSection, {
      type: "disc",
      diameterMm: OUTER_DIAMETER_MM,
      innerDiameterMm: INNER_DIAMETER_MM,
    });
    const expectedArea = circleArea(OUTER_DIAMETER_MM) - circleArea(INNER_DIAMETER_MM);

    expect(relativeError(footprint.area(), expectedArea)).toBeLessThan(AREA_TOLERANCE_RATIO);
  });
});
