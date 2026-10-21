import { describe, expect, it } from "vitest";

import { CENTER_ANGLE_DEG, DEGREES_PER_RADIAN } from "./angleConventions";
import {
  BASE_CLEARANCE_MM,
  computeEffectiveStudDiameterMm,
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeStudPlacements,
  computeSweepDeg,
  MODEL_BASE_DIAMETER_MM,
} from "./studPlacement";

const PRECISION_DIGITS = 9;
const QUARTER_TURN_DEG = 90;

describe("computeInnerRadiusMm", () => {
  it("is half the base diameter plus half the clearance", () => {
    expect(computeInnerRadiusMm()).toBeCloseTo(
      (MODEL_BASE_DIAMETER_MM + BASE_CLEARANCE_MM) / 2,
      PRECISION_DIGITS,
    );
  });
});

describe("computeOuterRadiusMm", () => {
  it("adds the ribbon's width to the fixed inner radius", () => {
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };

    expect(computeOuterRadiusMm(shape)).toBeCloseTo(
      computeInnerRadiusMm() + shape.ribbonWidthMm,
      PRECISION_DIGITS,
    );
  });
});

describe("computeSweepDeg", () => {
  it("converts an arc length in mm, measured on the fixed inner radius, to degrees", () => {
    const innerRadiusMm = computeInnerRadiusMm();
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 6,
      ribbonLengthMm: innerRadiusMm * (Math.PI / 2), // a quarter turn's worth of arc length
      studDiameterMm: 12,
    };

    expect(computeSweepDeg(shape)).toBeCloseTo(
      QUARTER_TURN_DEG,
      PRECISION_DIGITS,
    );
  });
});

describe("computeEffectiveStudDiameterMm", () => {
  it("returns the nominal stud diameter when it's already at least as wide as the ribbon", () => {
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };

    expect(computeEffectiveStudDiameterMm(shape)).toBe(shape.studDiameterMm);
  });

  it("grows to the ribbon's own width when the nominal stud diameter would leave a notch", () => {
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 20,
      ribbonLengthMm: 20,
      studDiameterMm: 6,
    };

    expect(computeEffectiveStudDiameterMm(shape)).toBe(shape.ribbonWidthMm);
  });
});

describe("computeStudPlacements", () => {
  it("places each stud so the ribbon's own inner-edge vertex sits exactly on its circumference", () => {
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const innerRadiusMm = computeInnerRadiusMm();
    const sweepDeg = computeSweepDeg(shape);
    const halfSweepDeg = sweepDeg / 2;
    const studRadiusMm = computeEffectiveStudDiameterMm(shape) / 2;

    const placements = computeStudPlacements(shape, CENTER_ANGLE_DEG);

    expect(placements.left.angleDeg).toBeCloseTo(
      CENTER_ANGLE_DEG + halfSweepDeg,
      PRECISION_DIGITS,
    );
    expect(placements.right.angleDeg).toBeCloseTo(
      CENTER_ANGLE_DEG - halfSweepDeg,
      PRECISION_DIGITS,
    );

    // The stud's center sits further out along the same ray, at innerRadiusMm + studRadiusMm:
    // so the vertex point (innerRadiusMm, that same angle) is exactly studRadiusMm away from
    // the stud's center, i.e. exactly on its circumference.
    const vertexToCenterDistance = (
      angleDeg: number,
      position: [number, number],
    ): number => {
      const angleRad = angleDeg / DEGREES_PER_RADIAN;
      const vertexX = innerRadiusMm * Math.cos(angleRad);
      const vertexY = innerRadiusMm * Math.sin(angleRad);

      return Math.hypot(position[0] - vertexX, position[1] - vertexY);
    };

    expect(
      vertexToCenterDistance(
        placements.left.angleDeg,
        placements.left.position,
      ),
    ).toBeCloseTo(studRadiusMm, PRECISION_DIGITS);
    expect(
      vertexToCenterDistance(
        placements.right.angleDeg,
        placements.right.position,
      ),
    ).toBeCloseTo(studRadiusMm, PRECISION_DIGITS);
  });
});

describe("computeStudPlacements stud diameter", () => {
  it("keeps the vertex touching point fixed when only studDiameterMm changes", () => {
    const baseShape = {
      type: "arc" as const,
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const biggerStudShape = { ...baseShape, studDiameterMm: 20 };

    const smallPlacements = computeStudPlacements(baseShape, CENTER_ANGLE_DEG);
    const bigPlacements = computeStudPlacements(
      biggerStudShape,
      CENTER_ANGLE_DEG,
    );

    // Angle is unaffected by stud diameter (ribbonLengthMm/ribbonWidthMm are unchanged), so the
    // vertex point itself (innerRadiusMm at that angle) is identical in both cases: only the
    // stud's own center should move further out, never the vertex it touches.
    expect(smallPlacements.left.angleDeg).toBeCloseTo(
      bigPlacements.left.angleDeg,
      PRECISION_DIGITS,
    );
    const smallDistance = Math.hypot(...smallPlacements.left.position);
    const bigDistance = Math.hypot(...bigPlacements.left.position);
    expect(bigDistance).toBeGreaterThan(smallDistance);
  });
});
