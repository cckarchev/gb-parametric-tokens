import { describe, expect, it } from "vitest";

import {
  computeInnerRadiusMm,
  computeNobPlacements,
  computeOuterRadiusMm,
} from "../geometry/nobPlacement";
import { StyleSpec, Vec2 } from "../types";
import { buildArcTokenMesh } from "./buildArcTokenMesh";

const shape = { type: "arc" as const, ribbonWidthMm: 15, ribbonLengthMm: 20, nobDiameterMm: 24 };
const centerAngleDeg = 90;
const nobPlacements = computeNobPlacements(shape, centerAngleDeg);
// Sits at the band's own midpoint radius so this relief component actually overlaps the
// ribbon, the same way a real centered text line would -- required for the "unions into a
// single connected solid" test below to mean anything.
const bandMidRadiusMm = (computeInnerRadiusMm() + computeOuterRadiusMm(shape)) / 2;

const smallSquareAt = (center: Vec2): Vec2[][] => [
  [
    [center[0] - 2, center[1] - 2],
    [center[0] + 2, center[1] - 2],
    [center[0] + 2, center[1] + 2],
    [center[0] - 2, center[1] + 2],
  ],
];

const baseInput = (style: StyleSpec) => ({
  shape,
  centerAngleDeg,
  style,
  nobPositions: { left: nobPlacements.left.position, right: nobPlacements.right.position },
  reliefComponents: [
    { contours: smallSquareAt(nobPlacements.left.position) },
    { contours: smallSquareAt(nobPlacements.right.position) },
    { contours: smallSquareAt([0, bandMidRadiusMm] as Vec2) },
  ],
});

describe("buildArcTokenMesh", () => {
  it("raises the relief above baseThicknessMm for relief: raised", async () => {
    const style: StyleSpec = { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 };

    const parts = await buildArcTokenMesh(baseInput(style));

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBeGreaterThan(3);
  });

  it("stays within baseThicknessMm for relief: engraved", async () => {
    const style: StyleSpec = { relief: "engraved", reliefHeightMm: 0.6, baseThicknessMm: 3 };

    const parts = await buildArcTokenMesh(baseInput(style));

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBe(3);
  });

  it("unions ribbon and nobs into a single connected solid", async () => {
    const style: StyleSpec = { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 };

    const parts = await buildArcTokenMesh(baseInput(style));

    // status() alone does not catch this: three tangent-but-disjoint solids are a
    // perfectly valid manifold, and the bounding-box tests below pass happily on them.
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.decompose().length).toBe(1);
  });

  it("includes both nobs in the bounding box", async () => {
    const style: StyleSpec = { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 };

    const parts = await buildArcTokenMesh(baseInput(style));
    const bounds = parts[0].manifold.boundingBox();

    expect(bounds.min[0]).toBeLessThan(nobPlacements.left.position[0] + 1);
    expect(bounds.max[0]).toBeGreaterThan(nobPlacements.right.position[0] - 1);
  });

  it("unions a growOutline contour into the base, past the plain nob's own radius", async () => {
    const style: StyleSpec = { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 };
    const nobRadiusMm = shape.nobDiameterMm / 2;
    // A square centered on the left nob, wider than the nob itself: proves the grown footprint
    // (not just the plain circle) makes it into the base's own outline.
    const farReachMm = nobRadiusMm + 5;
    const growSquareAtLeftNob: Vec2[][] = [
      [
        [nobPlacements.left.position[0] - farReachMm, nobPlacements.left.position[1] - farReachMm],
        [nobPlacements.left.position[0] + farReachMm, nobPlacements.left.position[1] - farReachMm],
        [nobPlacements.left.position[0] + farReachMm, nobPlacements.left.position[1] + farReachMm],
        [nobPlacements.left.position[0] - farReachMm, nobPlacements.left.position[1] + farReachMm],
      ],
    ];

    const parts = await buildArcTokenMesh({
      ...baseInput(style),
      reliefComponents: [{ contours: smallSquareAt([0, bandMidRadiusMm] as Vec2) }],
    });
    const partsWithGrow = await buildArcTokenMesh({
      ...baseInput(style),
      reliefComponents: [
        { contours: smallSquareAt([0, bandMidRadiusMm] as Vec2), growOutline: growSquareAtLeftNob },
      ],
    });

    const boundsWithoutGrow = parts[0].manifold.boundingBox();
    const boundsWithGrow = partsWithGrow[0].manifold.boundingBox();

    expect(boundsWithGrow.min[0]).toBeLessThan(boundsWithoutGrow.min[0]);
    expect(partsWithGrow[0].manifold.status()).toBe("NoError");
    expect(partsWithGrow[0].manifold.decompose().length).toBe(1);
  });

  it("adds material at the nob/ribbon junction when the fillet is enabled", async () => {
    const style: StyleSpec = { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 };
    const filletedShape = { ...shape, nobFilletEnabled: true, nobFilletRadiusMm: 3 };

    const plainParts = await buildArcTokenMesh({
      ...baseInput(style),
      reliefComponents: [],
    });
    const filletedParts = await buildArcTokenMesh({
      ...baseInput(style),
      shape: filletedShape,
      reliefComponents: [],
    });

    expect(filletedParts[0].manifold.status()).toBe("NoError");
    expect(filletedParts[0].manifold.decompose().length).toBe(1);
    // Closing only ever adds material (see filletOutline.ts), so the filleted solid's volume
    // is strictly larger once there's an actual notch at the nob/ribbon junction to fill.
    expect(filletedParts[0].manifold.volume()).toBeGreaterThan(plainParts[0].manifold.volume());
  });

  it("leaves the solid unchanged when the fillet is off", async () => {
    const style: StyleSpec = { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 };
    const disabledShape = { ...shape, nobFilletEnabled: false, nobFilletRadiusMm: 3 };

    const plainParts = await buildArcTokenMesh({ ...baseInput(style), reliefComponents: [] });
    const disabledParts = await buildArcTokenMesh({
      ...baseInput(style),
      shape: disabledShape,
      reliefComponents: [],
    });

    expect(disabledParts[0].manifold.volume()).toBeCloseTo(plainParts[0].manifold.volume(), 1);
  });

  it("keeps a distinctly colorGrouped text line as its own separate part", async () => {
    const style: StyleSpec = { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 };

    const parts = await buildArcTokenMesh({
      ...baseInput(style),
      reliefComponents: [
        { contours: smallSquareAt(nobPlacements.left.position), colorGroup: "accent" },
        { contours: smallSquareAt(nobPlacements.right.position), colorGroup: "accent" },
        { contours: smallSquareAt([0, bandMidRadiusMm] as Vec2), colorGroup: "accent" },
      ],
    });

    expect(parts).toHaveLength(2);
    expect(parts.map((part) => part.colorGroupId).sort()).toEqual(["accent", "base"]);

    const basePart = parts.find((part) => part.colorGroupId === "base");
    expect(basePart?.manifold.decompose().length).toBe(1); // ribbon+nobs still fused on their own
  });
});
