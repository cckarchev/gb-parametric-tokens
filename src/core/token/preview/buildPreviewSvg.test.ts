import { describe, expect, it } from "vitest";

import type { ReliefComponent } from "../mesh/reliefComponent";
import type { ColorGroupSpec, ShapeSpec, Vec2 } from "../types";
import { buildPreviewSvg } from "./buildPreviewSvg";

const square = (size: number): Vec2[] => [
  [0, 0],
  [size, 0],
  [size, size],
  [0, size],
];

const colorGroups: ColorGroupSpec[] = [
  { id: "base", name: "Body", color: "#2B2B2B" },
  { id: "text", name: "Text & symbols", color: "#F5F0E1" },
];

// The grid overlay always contributes one extra <path> (its own guide lines),
// on top of whatever token contours a test is asserting about.
const GRID_PATH_COUNT = 1;

const BASE_SIZE_MM = 20;
const RELIEF_SIZE_MM = 6;
const SMALL_RELIEF_SIZE_MM = 4;
const BASE_CONTOURS = [square(BASE_SIZE_MM)];

describe("buildPreviewSvg", () => {
  it("fills the base path with the base color group's color", () => {
    const { svg } = buildPreviewSvg(BASE_CONTOURS, [], colorGroups);

    expect(svg).toContain('fill="#2B2B2B"');
  });

  it("fills each relief component with its own resolved color group color, grouping same-color components into one path", () => {
    const reliefComponents: ReliefComponent[] = [
      {
        source: { kind: "decoration" },
        contours: [square(RELIEF_SIZE_MM)],
        colorGroup: "text",
      },
      {
        source: { kind: "decoration" },
        contours: [square(SMALL_RELIEF_SIZE_MM)],
        colorGroup: "text",
      },
    ];

    const { svg } = buildPreviewSvg(
      BASE_CONTOURS,
      reliefComponents,
      colorGroups,
    );

    expect(svg.match(/<path/g)?.length).toBe(2 + GRID_PATH_COUNT);
    expect(svg).toContain('fill="#F5F0E1"');
    expect(svg).toContain("M0,0 L6,0 L6,-6 L0,-6 Z");
    expect(svg).toContain("M0,0 L4,0 L4,-4 L0,-4 Z");
  });

  it("resolves an untagged relief component to the base color group", () => {
    const reliefComponents: ReliefComponent[] = [
      { source: { kind: "decoration" }, contours: [square(RELIEF_SIZE_MM)] },
    ];

    const { svg } = buildPreviewSvg(
      BASE_CONTOURS,
      reliefComponents,
      colorGroups,
    );

    const fillMatches = svg.match(/fill="#2B2B2B"/g);
    expect(fillMatches?.length).toBe(2);
  });
});

describe("buildPreviewSvg fallbacks and y axis", () => {
  it("falls back to the default gray when a relief component references an unknown color group", () => {
    const reliefComponents: ReliefComponent[] = [
      {
        source: { kind: "decoration" },
        contours: [square(RELIEF_SIZE_MM)],
        colorGroup: "missing",
      },
    ];

    const { svg } = buildPreviewSvg(
      BASE_CONTOURS,
      reliefComponents,
      colorGroups,
    );

    expect(svg).toContain('fill="#CCCCCC"');
  });

  it("negates y so the model's math-convention (y-up) coordinates render upright in SVG's y-down space", () => {
    // Tall side along +y, so it points up in the model. In SVG (y-down) it must
    // land at negative y, or the preview is upside down.
    const apexYMm = 5;
    const triangle: Vec2[] = [
      [0, 0],
      [10, 0],
      [0, apexYMm],
    ];

    const { svg } = buildPreviewSvg([triangle], [], colorGroups);

    expect(svg).toContain("M0,0 L10,0 L0,-5 Z");
  });
});

describe("buildPreviewSvg viewBox and grid", () => {
  it("sizes the viewBox to the combined, y-negated bounds of both contour sets, and returns it as numbers", () => {
    // A relief square past the base on both axes, from 25 to 30.
    const relief = { minMm: 25, maxMm: 30 };
    const reliefComponents: ReliefComponent[] = [
      {
        source: { kind: "decoration" },
        contours: [
          [
            [relief.minMm, relief.minMm],
            [relief.maxMm, relief.minMm],
            [relief.maxMm, relief.maxMm],
            [relief.minMm, relief.maxMm],
          ],
        ],
        colorGroup: "text",
      },
    ];

    const { svg, viewBox } = buildPreviewSvg(
      BASE_CONTOURS,
      reliefComponents,
      colorGroups,
    );

    expect(svg).toContain(
      `viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}"`,
    );

    // x is untouched by the y-flip: base spans 0..20, relief spans 25..30.
    expect(viewBox.x).toBeLessThanOrEqual(0);
    expect(viewBox.x + viewBox.width).toBeGreaterThanOrEqual(relief.maxMm);

    // y is negated: base spans -20..0, relief spans -30..-25, so the combined
    // range is -30..0, not the pre-flip 0..30.
    expect(viewBox.y).toBeLessThanOrEqual(-relief.maxMm);
    expect(viewBox.y + viewBox.height).toBeGreaterThanOrEqual(0);
  });

  it("renders only the base path plus the grid when there are no relief components", () => {
    const { svg } = buildPreviewSvg(BASE_CONTOURS, [], colorGroups);

    expect(svg.match(/<path/g)?.length).toBe(1 + GRID_PATH_COUNT);
  });

  it("includes a non-printing grid overlay layer", () => {
    const { svg } = buildPreviewSvg(BASE_CONTOURS, [], colorGroups);

    expect(svg).toContain('data-role="grid-overlay"');
  });
});

describe("buildPreviewSvg base-reference circle", () => {
  it("draws a non-printing 30mm base-reference circle at a fixed anchor, unaffected by the token's own content", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };

    const { svg } = buildPreviewSvg(BASE_CONTOURS, [], colorGroups, arcShape);

    expect(svg).toContain('data-role="base-reference-circle"');
    expect(svg).toContain('cx="15"');
    expect(svg).toContain('cy="15"');
    expect(svg).toContain('r="15"');
    // The filled circle has to come before the token's base, or it covers the
    // token. Matched on the base fill, since the grid's <path> comes even
    // earlier.
    expect(svg.indexOf('data-role="base-reference-circle"')).toBeLessThan(
      svg.indexOf('fill="#2B2B2B"'),
    );
  });

  it("keeps the circle at the same fixed anchor no matter how the shape's own parameters change", () => {
    const smallStud: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const bigStud: ShapeSpec = { ...smallStud, studDiameterMm: 24 };

    const smallSvg = buildPreviewSvg(
      BASE_CONTOURS,
      [],
      colorGroups,
      smallStud,
    ).svg;
    const bigSvg = buildPreviewSvg(BASE_CONTOURS, [], colorGroups, bigStud).svg;

    expect(smallSvg).toContain('cx="15" cy="15"');
    expect(bigSvg).toContain('cx="15" cy="15"');
  });
});

describe("buildPreviewSvg circle anchor", () => {
  it("shifts the token's own contours by the fixed anchor, so its local origin lands at the circle's center", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };

    const { svg } = buildPreviewSvg(BASE_CONTOURS, [], colorGroups, arcShape);

    // square(20) spans local (0,0)-(20,20); flipY negates y to (0,0)-(20,-20),
    // then the fixed anchor (15, 15) shifts it to (15,15)-(35,-5).
    expect(svg).toContain("M15,15 L35,15 L35,-5 L15,-5 Z");
  });

  it("grows the viewBox to fit the base-reference circle in full, instead of clipping it or leaving it flush against the token", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };

    const { viewBox } = buildPreviewSvg(
      BASE_CONTOURS,
      [],
      colorGroups,
      arcShape,
    );

    // Circle center is fixed at cy=15, so its bottom edge is 15 + 15 (radius) =
    // 30, plus the usual 5mm padding below that = 35.
    const circleBottomMm = 30;
    const paddingMm = 5;
    const floatToleranceMm = 1e-9;

    expect(viewBox.y + viewBox.height).toBeGreaterThanOrEqual(
      circleBottomMm + paddingMm - floatToleranceMm,
    );
  });

  it("omits the base-reference circle for a disc shape", () => {
    const discShape: ShapeSpec = { type: "disc", diameterMm: 25 };
    const { svg } = buildPreviewSvg(BASE_CONTOURS, [], colorGroups, discShape);

    expect(svg).not.toContain('data-role="base-reference-circle"');
  });

  it("omits the base-reference circle when no shape is given", () => {
    const { svg } = buildPreviewSvg(BASE_CONTOURS, [], colorGroups);

    expect(svg).not.toContain('data-role="base-reference-circle"');
  });
});
