import { describe, expect, it } from "vitest";

import type { ReliefComponent } from "../../mesh/reliefComponent";
import { GRID_STEP_MM } from "../../preview/svgGrid";
import type { ColorGroupSpec, ShapeSpec, Vec2 } from "../../types";
import { buildContactSheetSvg } from "./contactSheetSvg";

const discShape: ShapeSpec = { type: "disc", diameterMm: 10 };

const squareContour = (size: number): Vec2[][] => [
  [
    [0, 0],
    [size, 0],
    [size, size],
    [0, size],
  ],
];

const countOccurrences = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

// The two numbers a pattern's two capture groups read from the svg.
const capturedPair = (svg: string, pattern: RegExp): number[] => {
  const match = svg.match(pattern);

  if (!match) {
    throw new Error(`expected the svg to match ${pattern}`);
  }

  return match.slice(1).map(Number);
};

const colorGroups: ColorGroupSpec[] = [
  { id: "base", name: "Body", color: "#2B2B2B" },
  { id: "text", name: "Text & symbols", color: "#F5F0E1" },
];

// The grid overlay always contributes one extra <path> (its own guide lines), on top of
// whatever token contours a test is asserting about.
const GRID_PATH_COUNT = 1;

describe("buildContactSheetSvg", () => {
  it("returns an empty svg for no items", () => {
    const { svg } = buildContactSheetSvg([], 3, colorGroups);

    expect(svg).toContain("<svg");
    expect(countOccurrences(svg, "<path")).toBe(0);
  });

  it("emits one base path per item, filled with the base color group's color, and no text labels", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { svg } = buildContactSheetSvg(items, 2, colorGroups);

    expect(countOccurrences(svg, "<path")).toBe(2 + GRID_PATH_COUNT);
    expect(countOccurrences(svg, "<text")).toBe(0);
    expect(countOccurrences(svg, 'fill="#2B2B2B"')).toBe(2);
  });

  it("emits an extra path per relief component, filled with its resolved color group color", () => {
    const reliefComponents: ReliefComponent[] = [
      {
        source: { kind: "decoration" },
        contours: squareContour(4),
        colorGroup: "text",
      },
    ];
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents,
        copies: 1,
      },
    ];

    const { svg } = buildContactSheetSvg(items, 1, colorGroups);

    expect(countOccurrences(svg, "<path")).toBe(2 + GRID_PATH_COUNT);
    expect(svg).toContain('fill="#F5F0E1"');
  });

  it("sizes the viewBox from the grid of cells, wrapping to a new row per the columns count, and returns it as numbers", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { svg, viewBox } = buildContactSheetSvg(items, 2, colorGroups);

    // Cell: 10 + 2 * 2 = 14, rounded to 20 on both axes.
    expect(svg).toContain('viewBox="0 0 40 40"');
    expect(viewBox).toEqual({ x: 0, y: 0, width: 40, height: 40 });
  });

  it("rounds the disc section's cell size up to the next 20mm grid-vertex step", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(22),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { viewBox } = buildContactSheetSvg(items, 1, colorGroups);

    // Cell: 22 + 2 * 2 = 26, rounded to two grid steps: 40, so the centered item's middle lands
    // on an intersection.
    expect(viewBox).toEqual({ x: 0, y: 0, width: 40, height: 40 });
  });

  it("negates y so the model's math-convention (y-up) coordinates render upright in SVG's y-down space", () => {
    const triangle: Vec2[][] = [
      [
        [0, 0],
        [10, 0],
        [0, 5],
      ],
    ];

    const { svg } = buildContactSheetSvg(
      [
        {
          shape: discShape,
          baseContours: triangle,
          reliefComponents: [],
          copies: 1,
        },
      ],
      1,
      colorGroups,
    );

    // Flipped bounds: x 0..10, y -5..0. Cell: 10 + 2 * 2 = 14 by 5 + 2 * 2 = 9, rounded to 20 by 20.
    // Centered: offsetX = 10 - 5 = 5, offsetY = 10 - (-2.5) = 12.5.
    expect(svg).toContain("M5,12.5 L15,12.5 L5,7.5 Z");
  });

  it("includes a non-printing grid overlay layer", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { svg } = buildContactSheetSvg(items, 1, colorGroups);

    expect(svg).toContain('data-role="grid-overlay"');
  });

  it("draws a non-printing 30mm base-reference circle per arc item, at the same fixed local offset in every cell", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const items = [
      {
        shape: arcShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
      {
        shape: arcShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { svg } = buildContactSheetSvg(items, 2, colorGroups);

    expect(countOccurrences(svg, 'data-role="base-reference-circle"')).toBe(2);
    // The square stays inside the circle's footprint, so no margin. Cell = 30 (the circle).
    // First cell: circle center = 0 + 15 (CIRCLE_ANCHOR_X_SVG) = 15.
    expect(svg).toContain('cx="15" cy="15"');
    // Second cell (column 1): cellOriginX = 30, offsetX = 30, contoursOffsetX = 45.
    expect(svg).toContain('cx="45" cy="15"');
    expect(svg.indexOf('data-role="base-reference-circle"')).toBeLessThan(
      svg.indexOf('fill="#2B2B2B"'),
    );
  });

  it("leaves the base-reference circle out when asked to, and packs the arc cells tightly", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const items = [
      {
        shape: arcShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const withCircle = buildContactSheetSvg(items, 1, colorGroups);
    const withoutCircle = buildContactSheetSvg(items, 1, colorGroups, {
      showBaseReference: false,
    });

    expect(withoutCircle.svg).not.toContain(
      'data-role="base-reference-circle"',
    );
    expect(withoutCircle.viewBox.height).toBeLessThan(
      withCircle.viewBox.height,
    );
    // The 10mm square no longer waits for the 30mm circle: its top sits on the cell's padding,
    // and its origin (the token's axis) stays on the first vertical grid line.
    expect(withoutCircle.svg).toContain('d="M10,12 ');
  });

  it("draws the circle exactly at the token's own local origin, wherever that origin ends up in the sheet", () => {
    // Token and circle share one offset, so the token's origin and the circle's center render
    // at the same point. The contour starts at (0, 0), so the path's leading M shows where the
    // origin landed.
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const contoursIncludingOrigin: Vec2[][] = [
      [
        [0, 0],
        [40, 0],
        [40, 40],
        [0, 40],
      ],
    ];
    const items = [
      {
        shape: arcShape,
        baseContours: contoursIncludingOrigin,
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { svg } = buildContactSheetSvg(items, 1, colorGroups);

    const [circleX, circleY] = capturedPair(
      svg,
      /cx="(-?[\d.]+)" cy="(-?[\d.]+)"/,
    );
    // Anchored specifically to the base fill path (not the grid overlay's own <path>, which
    // also starts with an M command) so this reads the token's own rendered origin.
    const [originX, originY] = capturedPair(
      svg,
      /<path d="M(-?[\d.]+),(-?[\d.]+)[^"]*" fill="#2B2B2B"/,
    );

    expect(circleX).toBeCloseTo(originX, 9);
    expect(circleY).toBeCloseTo(originY, 9);
  });

  it("puts arc items in their own section above disc items, so the arc circle's footprint never inflates the disc section", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const items = [
      {
        shape: arcShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { svg, viewBox } = buildContactSheetSvg(items, 2, colorGroups);

    // Arc section: 30 tall (the circle), at y = 0.
    // Disc section from y = 30. Cell: 10 + 2 * 2 = 14, rounded to 20.
    // Centered: offsetX = 10 - 5 = 5, offsetY = 30 + 10 - (-5) = 45.
    expect(svg).toContain("M5,45 L15,45 L15,35 L5,35 Z");
    expect(viewBox).toEqual({ x: 0, y: 0, width: 30, height: 50 });
  });

  it("centers each disc item in its cell so its own center lands on a grid vertex, whatever its size", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
      {
        shape: discShape,
        baseContours: squareContour(16),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { svg, viewBox } = buildContactSheetSvg(items, 2, colorGroups);

    // Cell: 16 (largest item) + 2 * 2 = 20, already a whole vertex step.
    expect(viewBox).toEqual({ x: 0, y: 0, width: 40, height: 20 });

    const basePaths = [
      ...svg.matchAll(
        /<path d="M(-?[\d.]+),(-?[\d.]+)(?: L(-?[\d.]+),(-?[\d.]+))+ Z" fill="#2B2B2B"/g,
      ),
    ];

    expect(basePaths).toHaveLength(2);

    for (const pathAttr of svg.match(
      /<path d="[^"]*" fill="#2B2B2B"[^>]*\/>/g,
    ) ?? []) {
      const coordinates = [...pathAttr.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(
        ([, x, y]) => [Number(x), Number(y)],
      );
      const xs = coordinates.map(([x]) => x);
      const ys = coordinates.map(([, y]) => y);
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

      expect(centerX % GRID_STEP_MM).toBe(0);
      expect(centerY % GRID_STEP_MM).toBe(0);
    }
  });

  it("renders one cell per physical copy, not one cell per distinct item: the sheet must show what actually gets printed", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 3,
      },
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 2,
      },
    ];

    const { svg, viewBox } = buildContactSheetSvg(items, 5, colorGroups);

    // 3 + 2 copies = 5 cells, one row of 5.
    expect(countOccurrences(svg, 'fill="#2B2B2B"')).toBe(5);
    expect(viewBox).toEqual({ x: 0, y: 0, width: 100, height: 20 });
  });

  it("packs disc items of different diameters into their own tightly-sized sub-grid, instead of forcing every disc to share one cell size", () => {
    const smallDisc: ShapeSpec = { type: "disc", diameterMm: 10 };
    const bigDisc: ShapeSpec = { type: "disc", diameterMm: 20 };
    const items = [
      {
        shape: smallDisc,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 3,
      },
      {
        shape: bigDisc,
        baseContours: squareContour(20),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { viewBox } = buildContactSheetSvg(items, 5, colorGroups);

    // Small group: cell 10 + 2 * 2 = 14, rounded to 20. 3 items in one row: 60 wide, 20 tall.
    // Big group: cell 20 + 2 * 2 = 24, rounded to 40. 1 item: 40 wide, 40 tall.
    // Sheet: width max(60, 40) = 60, height 20 + 40 = 60.
    expect(viewBox).toEqual({ x: 0, y: 0, width: 60, height: 60 });
  });

  it("lets a small-diameter disc group flow into as many columns as fit the sheet's reference width, instead of wrapping at the same fixed column count as everything else", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const smallDisc: ShapeSpec = { type: "disc", diameterMm: 10 };
    const items = [
      {
        shape: arcShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
      {
        shape: smallDisc,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 8,
      },
    ];

    // Fewer columns than the disc group fits, so sharing the column count would show.
    const { viewBox } = buildContactSheetSvg(items, 2, colorGroups);

    // Arc cell 30, so the sheet is 2 * 30 = 60 wide.
    // Disc cell 20: floor(60 / 20) = 3 columns. 8 items in 3 rows: 60 wide, 60 tall.
    // Height: 30 (arc) + 60 = 90.
    expect(viewBox).toEqual({ x: 0, y: 0, width: 60, height: 90 });
  });

  it("wraps a disc group into more rows instead of a wider sheet once it has more items than the reference width allows per row", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const bigDisc: ShapeSpec = { type: "disc", diameterMm: 90 };
    const items = [
      {
        shape: arcShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
      {
        shape: bigDisc,
        baseContours: squareContour(90),
        reliefComponents: [],
        copies: 5,
      },
    ];

    // 5 columns of the big disc would be far wider than the sheet.
    const { viewBox } = buildContactSheetSvg(items, 5, colorGroups);

    // Arc cell 30, so the sheet is 5 * 30 = 150 wide.
    // Disc cell: 90 + 2 * 2 = 94, rounded to 100. floor(150 / 100) = 1 column: 5 rows, 500 tall.
    // Height: 30 (arc) + 500 = 530.
    expect(viewBox).toEqual({ x: 0, y: 0, width: 100, height: 530 });
  });

  it("caps the sheet's reference width at MAX_SHEET_WIDTH_MM instead of letting a group flow arbitrarily far to the right", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const smallDisc: ShapeSpec = { type: "disc", diameterMm: 10 };
    const items = [
      {
        shape: arcShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
      {
        shape: smallDisc,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 30,
      },
    ];

    // 100 columns of the 30mm arc cell would be 3000mm wide.
    const { viewBox } = buildContactSheetSvg(items, 100, colorGroups);

    // Sheet width capped at MAX_SHEET_WIDTH_MM = 240.
    // Disc cell 20: floor(240 / 20) = 12 columns. 30 items in 3 rows: 240 wide, 60 tall.
    // Height: 30 (arc) + 60 = 90.
    expect(viewBox).toEqual({ x: 0, y: 0, width: 240, height: 90 });
  });

  it("keeps every arc circle's edges on the 10mm grid, even when the token's own content overflows its footprint by an amount that isn't already grid-aligned", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    // After the +15 shift to the circle's anchor, this reaches 7mm left of and above the
    // circle's footprint: not a whole grid step, so the margin has to be rounded.
    const overflowingContour: Vec2[][] = [
      [
        [-22, -8],
        [47, -8],
        [47, 22],
        [-22, 22],
      ],
    ];
    const items = [
      {
        shape: arcShape,
        baseContours: overflowingContour,
        reliefComponents: [],
        copies: 4,
      },
    ];

    const { svg } = buildContactSheetSvg(items, 2, colorGroups);

    const circleCenters = [
      ...svg.matchAll(/cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g),
    ].map(([, x, y]) => [Number(x), Number(y)]);

    expect(circleCenters).toHaveLength(4);

    for (const [cx, cy] of circleCenters) {
      // The circle is 30mm across, so its edges are on the grid when its center is 15mm off it.
      expect((cx - 15) % GRID_STEP_MM).toBeCloseTo(0);
      expect((cy - 15) % GRID_STEP_MM).toBeCloseTo(0);
    }
  });

  it("omits the base-reference circle for disc-shaped items", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { svg } = buildContactSheetSvg(items, 1, colorGroups);

    expect(svg).not.toContain('data-role="base-reference-circle"');
  });

  it("marks an invalid item's cell with an attention marker naming it and its specific reason, and none for a valid one", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
        label: "Beer Token",
        valid: false,
        reason: "2 of 5 details (text or icon) too thin to print at this size.",
      },
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
        label: "Coin",
        valid: true,
        reason: "",
      },
    ];

    const { svg } = buildContactSheetSvg(items, 2, colorGroups);

    expect(countOccurrences(svg, 'data-role="attention-marker"')).toBe(1);
    expect(svg).toContain(
      "<title>Beer Token: 2 of 5 details (text or icon) too thin to print at this size.</title>",
    );
    expect(svg).not.toContain("<title>Coin: ");
  });

  it("fits the attention marker tightly to the item's own content, not the whole padded/grid-aligned cell", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
        label: "Beer Token",
        valid: false,
        reason: "2 of 5 details too thin to print at this size.",
      },
    ];

    const { svg } = buildContactSheetSvg(items, 1, colorGroups);

    // Cell 20 by 20 for a 10 by 10 token, centered at (5, 5)-(15, 15). The marker frames the
    // token, not the cell.
    expect(svg).toContain(
      '<rect x="5" y="5" width="10" height="10" fill="none" stroke="#ff6b6b" stroke-width="0.6" stroke-dasharray="2 1" />',
    );
  });

  it("leaves an item with no valid flag unmarked", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 1,
      },
    ];

    const { svg } = buildContactSheetSvg(items, 1, colorGroups);

    expect(svg).not.toContain('data-role="attention-marker"');
  });

  it("marks every physical copy of an invalid item, not just the first", () => {
    const items = [
      {
        shape: discShape,
        baseContours: squareContour(10),
        reliefComponents: [],
        copies: 3,
        label: "Beer Token",
        valid: false,
        reason: "1 of 1 detail (text or icon) too thin to print at this size.",
      },
    ];

    const { svg } = buildContactSheetSvg(items, 3, colorGroups);

    expect(countOccurrences(svg, 'data-role="attention-marker"')).toBe(3);
  });
});
