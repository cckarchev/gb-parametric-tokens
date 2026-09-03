import { describe, expect, it } from "vitest";

import {
  BASE_CLEARANCE_MM,
  computeEffectiveNobDiameterMm,
  computeInnerRadiusMm,
  computeNobPlacements,
  computeOuterRadiusMm,
  computeSweepDeg,
  MODEL_BASE_DIAMETER_MM,
} from "./nobPlacement";

describe("computeInnerRadiusMm", () => {
  it("is half the base diameter plus half the clearance", () => {
    expect(computeInnerRadiusMm()).toBeCloseTo((MODEL_BASE_DIAMETER_MM + BASE_CLEARANCE_MM) / 2, 9);
  });
});

describe("computeOuterRadiusMm", () => {
  it("adds the ribbon's width to the fixed inner radius", () => {
    const shape = { type: "arc" as const, ribbonWidthMm: 6, ribbonLengthMm: 20, nobDiameterMm: 12 };

    expect(computeOuterRadiusMm(shape)).toBeCloseTo(computeInnerRadiusMm() + 6, 9);
  });
});

describe("computeSweepDeg", () => {
  it("converts an arc length in mm, measured on the fixed inner radius, to degrees", () => {
    const innerRadiusMm = computeInnerRadiusMm();
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 6,
      ribbonLengthMm: innerRadiusMm * (Math.PI / 2), // a quarter turn's worth of arc length
      nobDiameterMm: 12,
    };

    expect(computeSweepDeg(shape)).toBeCloseTo(90, 9);
  });
});

describe("computeEffectiveNobDiameterMm", () => {
  it("returns the nominal nob diameter when it's already at least as wide as the ribbon", () => {
    const shape = { type: "arc" as const, ribbonWidthMm: 6, ribbonLengthMm: 20, nobDiameterMm: 12 };

    expect(computeEffectiveNobDiameterMm(shape)).toBe(12);
  });

  it("grows to the ribbon's own width when the nominal nob diameter would leave a notch", () => {
    const shape = { type: "arc" as const, ribbonWidthMm: 20, ribbonLengthMm: 20, nobDiameterMm: 6 };

    expect(computeEffectiveNobDiameterMm(shape)).toBe(20);
  });
});

describe("computeNobPlacements", () => {
  it("places each nob so the ribbon's own inner-edge vertex sits exactly on its circumference", () => {
    const shape = { type: "arc" as const, ribbonWidthMm: 6, ribbonLengthMm: 20, nobDiameterMm: 12 };
    const innerRadiusMm = computeInnerRadiusMm();
    const sweepDeg = computeSweepDeg(shape);
    const halfSweepDeg = sweepDeg / 2;
    const nobRadiusMm = computeEffectiveNobDiameterMm(shape) / 2;

    const placements = computeNobPlacements(shape, 90);

    expect(placements.left.angleDeg).toBeCloseTo(90 + halfSweepDeg, 9);
    expect(placements.right.angleDeg).toBeCloseTo(90 - halfSweepDeg, 9);

    // The nob's center sits further out along the same ray, at innerRadiusMm + nobRadiusMm --
    // so the vertex point (innerRadiusMm, that same angle) is exactly nobRadiusMm away from
    // the nob's center, i.e. exactly on its circumference.
    const vertexToCenterDistance = (angleDeg: number, position: [number, number]): number => {
      const angleRad = (angleDeg * Math.PI) / 180;
      const vertexX = innerRadiusMm * Math.cos(angleRad);
      const vertexY = innerRadiusMm * Math.sin(angleRad);

      return Math.hypot(position[0] - vertexX, position[1] - vertexY);
    };

    expect(vertexToCenterDistance(placements.left.angleDeg, placements.left.position)).toBeCloseTo(
      nobRadiusMm,
      9,
    );
    expect(
      vertexToCenterDistance(placements.right.angleDeg, placements.right.position),
    ).toBeCloseTo(nobRadiusMm, 9);
  });

  it("keeps the vertex touching point fixed when only nobDiameterMm changes", () => {
    const baseShape = {
      type: "arc" as const,
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      nobDiameterMm: 12,
    };
    const biggerNobShape = { ...baseShape, nobDiameterMm: 20 };

    const smallPlacements = computeNobPlacements(baseShape, 90);
    const bigPlacements = computeNobPlacements(biggerNobShape, 90);

    // Angle is unaffected by nob diameter (ribbonLengthMm/ribbonWidthMm are unchanged), so the
    // vertex point itself (innerRadiusMm at that angle) is identical in both cases -- only the
    // nob's own center should move further out, never the vertex it touches.
    expect(smallPlacements.left.angleDeg).toBeCloseTo(bigPlacements.left.angleDeg, 9);
    const smallDistance = Math.hypot(...smallPlacements.left.position);
    const bigDistance = Math.hypot(...bigPlacements.left.position);
    expect(bigDistance).toBeGreaterThan(smallDistance);
  });
});
