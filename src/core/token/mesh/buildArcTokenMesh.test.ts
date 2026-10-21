import { describe, expect, it } from "vitest";

import { computeBounds } from "../geometry/computeBounds";
import {
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeStudPlacements,
} from "../geometry/studPlacement";
import { computeBaseOutlineContours } from "../preview/computeBaseOutlineContours";
import type { StyleSpec, Vec2 } from "../types";
import { buildArcTokenMesh } from "./buildArcTokenMesh";
import type { ReliefComponent } from "./reliefComponent";

const shape = {
  type: "arc" as const,
  ribbonWidthMm: 15,
  ribbonLengthMm: 20,
  studDiameterMm: 24,
};
const centerAngleDeg = 90;
const studPlacements = computeStudPlacements(shape, centerAngleDeg);
// Sits at the band's own midpoint radius so this relief component actually overlaps the
// ribbon, the same way a real centered text line would: required for the "unions into a
// single connected solid" test below to mean anything.
const bandMidRadiusMm =
  (computeInnerRadiusMm() + computeOuterRadiusMm(shape)) / 2;

const smallSquareAt = (center: Vec2): Vec2[][] => [
  [
    [center[0] - 2, center[1] - 2],
    [center[0] + 2, center[1] - 2],
    [center[0] + 2, center[1] + 2],
    [center[0] - 2, center[1] + 2],
  ],
];

const baseReliefComponents: ReliefComponent[] = [
  {
    source: { kind: "decoration" },
    contours: smallSquareAt(studPlacements.left.position),
  },
  {
    source: { kind: "decoration" },
    contours: smallSquareAt(studPlacements.right.position),
  },
  {
    source: { kind: "decoration" },
    contours: smallSquareAt([0, bandMidRadiusMm] as Vec2),
  },
];

const baseInput = (style: StyleSpec) => ({
  shape,
  centerAngleDeg,
  style,
  studPositions: {
    left: studPlacements.left.position,
    right: studPlacements.right.position,
  },
  reliefComponents: baseReliefComponents,
});

describe("buildArcTokenMesh", () => {
  it("raises the relief above baseThicknessMm for relief: raised", async () => {
    const style: StyleSpec = {
      relief: "raised",
      reliefHeightMm: 0.6,
      baseThicknessMm: 3,
    };

    const parts = await buildArcTokenMesh(baseInput(style));

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBeGreaterThan(3);
  });

  it("stays within baseThicknessMm for relief: engraved", async () => {
    const style: StyleSpec = {
      relief: "engraved",
      reliefHeightMm: 0.6,
      baseThicknessMm: 3,
    };

    const parts = await buildArcTokenMesh(baseInput(style));

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBe(3);
  });

  it("unions ribbon and studs into a single connected solid", async () => {
    const style: StyleSpec = {
      relief: "raised",
      reliefHeightMm: 0.6,
      baseThicknessMm: 3,
    };

    const parts = await buildArcTokenMesh(baseInput(style));

    // status() alone does not catch this: three tangent-but-disjoint solids are a
    // perfectly valid manifold, and the bounding-box tests below pass happily on them.
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.decompose().length).toBe(1);
  });

  it("includes both studs in the bounding box", async () => {
    const style: StyleSpec = {
      relief: "raised",
      reliefHeightMm: 0.6,
      baseThicknessMm: 3,
    };

    const parts = await buildArcTokenMesh(baseInput(style));
    const bounds = parts[0].manifold.boundingBox();

    expect(bounds.min[0]).toBeLessThan(studPlacements.left.position[0] + 1);
    expect(bounds.max[0]).toBeGreaterThan(studPlacements.right.position[0] - 1);
  });

  it("unions a growOutline contour into the base, past the plain stud's own radius", async () => {
    const style: StyleSpec = {
      relief: "raised",
      reliefHeightMm: 0.6,
      baseThicknessMm: 3,
    };
    const studRadiusMm = shape.studDiameterMm / 2;
    // A square centered on the left stud, wider than the stud itself: proves the grown footprint
    // (not just the plain circle) makes it into the base's own outline.
    const farReachMm = studRadiusMm + 5;
    const growSquareAtLeftStud: Vec2[][] = [
      [
        [
          studPlacements.left.position[0] - farReachMm,
          studPlacements.left.position[1] - farReachMm,
        ],
        [
          studPlacements.left.position[0] + farReachMm,
          studPlacements.left.position[1] - farReachMm,
        ],
        [
          studPlacements.left.position[0] + farReachMm,
          studPlacements.left.position[1] + farReachMm,
        ],
        [
          studPlacements.left.position[0] - farReachMm,
          studPlacements.left.position[1] + farReachMm,
        ],
      ],
    ];

    const parts = await buildArcTokenMesh({
      ...baseInput(style),
      reliefComponents: [
        {
          source: { kind: "decoration" },
          contours: smallSquareAt([0, bandMidRadiusMm] as Vec2),
        },
      ],
    });
    const partsWithGrow = await buildArcTokenMesh({
      ...baseInput(style),
      reliefComponents: [
        {
          source: { kind: "decoration" },
          contours: smallSquareAt([0, bandMidRadiusMm] as Vec2),
          growOutline: growSquareAtLeftStud,
        },
      ],
    });

    const boundsWithoutGrow = parts[0].manifold.boundingBox();
    const boundsWithGrow = partsWithGrow[0].manifold.boundingBox();

    expect(boundsWithGrow.min[0]).toBeLessThan(boundsWithoutGrow.min[0]);
    expect(partsWithGrow[0].manifold.status()).toBe("NoError");
    expect(partsWithGrow[0].manifold.decompose().length).toBe(1);
  });

  it("adds material at the stud/ribbon junction when the fillet is enabled", async () => {
    const style: StyleSpec = {
      relief: "raised",
      reliefHeightMm: 0.6,
      baseThicknessMm: 3,
    };
    const filletedShape = {
      ...shape,
      studFilletEnabled: true,
      studFilletRadiusMm: 3,
    };

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
    // is strictly larger once there's an actual notch at the stud/ribbon junction to fill.
    expect(filletedParts[0].manifold.volume()).toBeGreaterThan(
      plainParts[0].manifold.volume(),
    );
  });

  it("leaves the solid unchanged when the fillet is off", async () => {
    const style: StyleSpec = {
      relief: "raised",
      reliefHeightMm: 0.6,
      baseThicknessMm: 3,
    };
    const disabledShape = {
      ...shape,
      studFilletEnabled: false,
      studFilletRadiusMm: 3,
    };

    const plainParts = await buildArcTokenMesh({
      ...baseInput(style),
      reliefComponents: [],
    });
    const disabledParts = await buildArcTokenMesh({
      ...baseInput(style),
      shape: disabledShape,
      reliefComponents: [],
    });

    expect(disabledParts[0].manifold.volume()).toBeCloseTo(
      plainParts[0].manifold.volume(),
      1,
    );
  });

  it("keeps a distinctly colorGrouped text line as its own separate part", async () => {
    const style: StyleSpec = {
      relief: "raised",
      reliefHeightMm: 0.6,
      baseThicknessMm: 3,
    };

    const parts = await buildArcTokenMesh({
      ...baseInput(style),
      reliefComponents: [
        {
          source: { kind: "decoration" },
          contours: smallSquareAt(studPlacements.left.position),
          colorGroup: "accent",
        },
        {
          source: { kind: "decoration" },
          contours: smallSquareAt(studPlacements.right.position),
          colorGroup: "accent",
        },
        {
          source: { kind: "decoration" },
          contours: smallSquareAt([0, bandMidRadiusMm] as Vec2),
          colorGroup: "accent",
        },
      ],
    });

    expect(parts).toHaveLength(2);
    expect(parts.map((part) => part.colorGroupId).sort()).toEqual([
      "accent",
      "base",
    ]);

    const basePart = parts.find((part) => part.colorGroupId === "base");
    expect(basePart?.manifold.decompose().length).toBe(1); // ribbon+studs still fused on their own
  });

  // A stud narrower than the ribbon grows to its width (computeEffectiveStudDiameterMm). The mesh
  // has to grow it like the preview does, or the print carries a notch the screen never showed.
  it("gives a ribbon wider than its stud the same footprint the 2D preview draws", async () => {
    const wideRibbonShape = {
      type: "arc" as const,
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 8,
    };
    const placements = computeStudPlacements(wideRibbonShape, centerAngleDeg);

    const parts = await buildArcTokenMesh({
      shape: wideRibbonShape,
      centerAngleDeg,
      style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
      studPositions: {
        left: placements.left.position,
        right: placements.right.position,
      },
      reliefComponents: [],
    });

    const previewBounds = computeBounds(
      await computeBaseOutlineContours(wideRibbonShape, centerAngleDeg),
    );
    const meshBox = parts[0].manifold.boundingBox();

    expect(meshBox.min[0]).toBeCloseTo(previewBounds.min[0], 2);
    expect(meshBox.max[0]).toBeCloseTo(previewBounds.max[0], 2);
    expect(meshBox.min[1]).toBeCloseTo(previewBounds.min[1], 2);
    expect(meshBox.max[1]).toBeCloseTo(previewBounds.max[1], 2);
  });
});
