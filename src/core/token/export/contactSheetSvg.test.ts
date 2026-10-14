import { describe, expect, it } from "vitest";

import { ReliefComponent } from "../mesh/reliefComponent";
import { GRID_STEP_MM } from "../preview/svgGrid";
import { ColorGroupSpec, ShapeSpec, Vec2 } from "../types";
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

const countOccurrences = (haystack: string, needle: string): number => {
  return haystack.split(needle).length - 1;
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
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
    ];

    const { svg } = buildContactSheetSvg(items, 2, colorGroups);

    expect(countOccurrences(svg, "<path")).toBe(2 + GRID_PATH_COUNT);
    expect(countOccurrences(svg, "<text")).toBe(0);
    expect(countOccurrences(svg, 'fill="#2B2B2B"')).toBe(2);
  });

  it("emits an extra path per relief component, filled with its resolved color group color", () => {
    const reliefComponents: ReliefComponent[] = [
      { contours: squareContour(4), colorGroup: "text" },
    ];
    const items = [
      { shape: discShape, baseContours: squareContour(10), reliefComponents, copies: 1 },
    ];

    const { svg } = buildContactSheetSvg(items, 1, colorGroups);

    expect(countOccurrences(svg, "<path")).toBe(2 + GRID_PATH_COUNT);
    expect(svg).toContain('fill="#F5F0E1"');
  });

  it("sizes the viewBox from the grid of cells, wrapping to a new row per the columns count, and returns it as numbers", () => {
    const items = [
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
    ];

    const { svg, viewBox } = buildContactSheetSvg(items, 2, colorGroups);

    // Disc section: raw cellWidth = 10 + 2*2 padding = 14, rounded up to the next 10mm grid
    // line = 20; same for cellHeight (disc items carry no circle, so no extra margin).
    expect(svg).toContain('viewBox="0 0 40 40"');
    expect(viewBox).toEqual({ x: 0, y: 0, width: 40, height: 40 });
  });

  it("rounds the disc section's cell size up to the next 20mm grid-vertex step", () => {
    const items = [
      { shape: discShape, baseContours: squareContour(22), reliefComponents: [], copies: 1 },
    ];

    const { viewBox } = buildContactSheetSvg(items, 1, colorGroups);

    // raw cell = 22 + 2*2 padding = 26, rounded up to the next 20mm grid-vertex step = 40 (not
    // just the next 10mm grid line: a 20mm-stepped cell is what guarantees the item's own
    // center, at exactly half the cell, still lands on a grid vertex).
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
      [{ shape: discShape, baseContours: triangle, reliefComponents: [], copies: 1 }],
      1,
      colorGroups,
    );

    // Flipped bounds span x = 0..10, y = -5..0. raw cell = 10 + 2*2 padding = 14 (width) and
    // 5 + 2*2 = 9 (height), each rounded up to the 20mm grid-vertex step. The item is then
    // centered in that cell: offsetX = 10 (cellWidth/2) - 5 (content center x) = 5, offsetY = 10
    // (cellHeight/2) - (-2.5) (content center y) = 12.5.
    expect(svg).toContain("M5,12.5 L15,12.5 L5,7.5 Z");
  });

  it("includes a non-printing grid overlay layer", () => {
    const items = [
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
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
      { shape: arcShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
      { shape: arcShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
    ];

    const { svg } = buildContactSheetSvg(items, 2, colorGroups);

    expect(countOccurrences(svg, 'data-role="base-reference-circle"')).toBe(2);
    // squareContour(10) never reaches left of/above the circle's own local footprint
    // (0,0)-(30,30), so there's no real overflow (raw margin 0). CELL_PADDING_MM is 0 (a multiple
    // of GRID_STEP_MM), so the left/top margin needs no rounding-up bump on top of it either:
    // cellWidthMm = 30 (circle's own span) + 2*0 padding + 0 margin = 30, already grid-aligned.
    // offsetX = 0 + 0 (padding) + 0 (margin) = 0, contoursOffsetX = 0 + 15 (CIRCLE_ANCHOR_X_SVG)
    // = 15 for the first cell.
    expect(svg).toContain('cx="15" cy="15"');
    // Second cell (column 1): cellOriginX = 30, offsetX = 30, contoursOffsetX = 45.
    expect(svg).toContain('cx="45" cy="15"');
    expect(svg.indexOf('data-role="base-reference-circle"')).toBeLessThan(
      svg.indexOf('fill="#2B2B2B"'),
    );
  });

  it("draws the circle exactly at the token's own local origin, wherever that origin ends up in the sheet", () => {
    // This is the direct regression test for the original bug (changing studDiameterMm visibly
    // shifted a token relative to its circle): the token's own local origin (0,0) and the
    // circle's center must always render at the exact same point, whatever that point is,
    // not merely close, not "usually", because the render loop applies the identical
    // (contoursOffsetX, contoursOffsetY) translation to both. Including (0,0) as the first
    // vertex of the base contour reveals exactly where the origin lands, via the path's own
    // leading M command.
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
      { shape: arcShape, baseContours: contoursIncludingOrigin, reliefComponents: [], copies: 1 },
    ];

    const { svg } = buildContactSheetSvg(items, 1, colorGroups);

    const [circleX, circleY] = svg
      .match(/cx="(-?[\d.]+)" cy="(-?[\d.]+)"/)!
      .slice(1)
      .map(Number);
    // Anchored specifically to the base fill path (not the grid overlay's own <path>, which
    // also starts with an M command) so this reads the token's own rendered origin.
    const [originX, originY] = svg
      .match(/<path d="M(-?[\d.]+),(-?[\d.]+)[^"]*" fill="#2B2B2B"/)!
      .slice(1)
      .map(Number);

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
      { shape: arcShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
    ];

    const { svg, viewBox } = buildContactSheetSvg(items, 2, colorGroups);

    // Arc section: circle footprint (30), no padding needed on top (see the dedicated
    // base-reference-circle test above) = 30 tall, at y=0.
    // Disc section starts immediately below the arc section (at y=30, already a multiple of
    // GRID_STEP_MM, so no extra gap is added on top of that), unaffected by the circle: raw
    // content 10 + 2*2 padding = 14, rounded up to the 20mm grid-vertex step = 20. The item is
    // centered in that cell: offsetX = 10 (cellWidth/2) - 5 (content center x) = 5; offsetY = 30
    // + 10 (cellHeight/2) - (-5) (content center y) = 45.
    expect(svg).toContain("M5,45 L15,45 L15,35 L5,35 Z");
    expect(viewBox).toEqual({ x: 0, y: 0, width: 30, height: 50 });
  });

  it("centers each disc item in its cell so its own center lands on a grid vertex, whatever its size", () => {
    const items = [
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
      { shape: discShape, baseContours: squareContour(16), reliefComponents: [], copies: 1 },
    ];

    const { svg, viewBox } = buildContactSheetSvg(items, 2, colorGroups);

    // raw cell = 16 (largest item) + 2*2 padding = 20, already a 20mm grid-vertex step.
    expect(viewBox).toEqual({ x: 0, y: 0, width: 40, height: 20 });

    const basePaths = [
      ...svg.matchAll(
        /<path d="M(-?[\d.]+),(-?[\d.]+)(?: L(-?[\d.]+),(-?[\d.]+))+ Z" fill="#2B2B2B"/g,
      ),
    ];

    expect(basePaths).toHaveLength(2);

    for (const pathAttr of svg.match(/<path d="[^"]*" fill="#2B2B2B"[^>]*\/>/g) ?? []) {
      const coordinates = [...pathAttr.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(([, x, y]) => [
        Number(x),
        Number(y),
      ]);
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
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 3 },
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 2 },
    ];

    const { svg, viewBox } = buildContactSheetSvg(items, 5, colorGroups);

    // 3 copies of item 1 + 2 copies of item 2 = 5 cells total, filling one row of 5 columns.
    expect(countOccurrences(svg, 'fill="#2B2B2B"')).toBe(5);
    expect(viewBox).toEqual({ x: 0, y: 0, width: 100, height: 20 });
  });

  it("packs disc items of different diameters into their own tightly-sized sub-grid, instead of forcing every disc to share one cell size", () => {
    const smallDisc: ShapeSpec = { type: "disc", diameterMm: 10 };
    const bigDisc: ShapeSpec = { type: "disc", diameterMm: 20 };
    const items = [
      { shape: smallDisc, baseContours: squareContour(10), reliefComponents: [], copies: 3 },
      { shape: bigDisc, baseContours: squareContour(20), reliefComponents: [], copies: 1 },
    ];

    const { viewBox } = buildContactSheetSvg(items, 5, colorGroups);

    // Small group: raw cell = 10 + 2*2 padding = 14, rounded up to the 20mm grid-vertex step =
    // 20. Reference width comes from the widest group (the big one, 40mm) -> target width =
    // 5*40 = 200mm, so the small group could use up to 10 columns; with only 3 items it still
    // fits one row -> 20mm tall, 60mm wide (item count, not the column cap, decides the width).
    // Big group: raw cell = 20 + 2*2 padding = 24, rounded up to 40; 1 item -> 40mm tall, 40mm
    // wide. Stacked directly below the small group (no extra gap beyond each group's own
    // padding): total height = 20 + 40 = 60. If both sizes shared one cell (the pre-fix
    // behavior), every disc would sit in one 40mm-tall row instead of two separate grids.
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
      { shape: arcShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
      { shape: smallDisc, baseContours: squareContour(10), reliefComponents: [], copies: 8 },
    ];

    // columns: 2, deliberately small, so the difference between "everyone shares this fixed
    // column count" and "each group fills the reference width" is unmistakable.
    const { viewBox } = buildContactSheetSvg(items, 2, colorGroups);

    // Arc cell = circle footprint (30), no padding needed on top (matches the dedicated
    // base-reference-circle test above). Reference width = columns(2) * 30 = 60mm.
    // Small disc cell = 10 + 2*2 padding = 14, rounded up to the 20mm grid-vertex step = 20.
    // columnsToFillTargetWidth = floor(60/20) = 3, not the fixed columns=2 passed in: with 8
    // items that's 3 rows of up to 3 (60mm wide, 60mm tall for the disc group), stacked below the
    // 30mm-tall arc section, for 90mm total height.
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
      { shape: arcShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
      { shape: bigDisc, baseContours: squareContour(90), reliefComponents: [], copies: 5 },
    ];

    // columns: 5, the fixed count a "Goal Influence" style group used to wrap at regardless of
    // how much wider that made its own row than the rest of the sheet.
    const { viewBox } = buildContactSheetSvg(items, 5, colorGroups);

    // Arc cell = 30mm (as above). Reference width = columns(5) * 30 = 150mm.
    // Big disc cell = 90 + 2*2 padding = 94, rounded up to the 20mm grid-vertex step = 100.
    // columnsToFillTargetWidth = floor(150/100) = 1, not the fixed columns=5: with 5 items
    // that's 5 rows of 1 (100mm wide, 500mm tall for the disc group alone), not 1 row of 5
    // (500mm wide) the way a fixed column count would have laid it out. Arc section itself: 1
    // item, still a single 30mm-wide, 30mm-tall row. Total height = 30 (arc) + 500 (disc) = 530.
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
      { shape: arcShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
      { shape: smallDisc, baseContours: squareContour(10), reliefComponents: [], copies: 30 },
    ];

    // columns: 100, large enough that columns * the arc's own 50mm cell (5000mm) would blow
    // past any reasonable sheet width if nothing capped it.
    const { viewBox } = buildContactSheetSvg(items, 100, colorGroups);

    // Arc cell = 30mm. Uncapped reference width would be 100*30 = 3000mm; capped at
    // MAX_SHEET_WIDTH_MM = 240mm instead. Arc itself: columnsToFillTargetWidth(30) = floor(240/
    // 30) = 8, but only 1 item -> still a single 30mm-wide, 30mm-tall row, unaffected.
    // Small disc cell = 20mm: columnsToFillTargetWidth(20) = floor(240/20) = 12 (not 200, and
    // nowhere near the fixed columns=100 passed in). 30 items over 12 columns = 3 rows of up to
    // 12 -> 240mm wide, 60mm tall. Disc section starts at y=30 (arc height, already a multiple
    // of GRID_STEP_MM). Total: width = max(30, 240) = 240; height = 30 + 60 = 90.
    expect(viewBox).toEqual({ x: 0, y: 0, width: 240, height: 90 });
  });

  it("keeps every arc circle's edges on the 10mm grid, even when the token's own content overflows its footprint by an amount that isn't already grid-aligned", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    // Overflows past the circle's own (0,0)-(30,30) local footprint on the left and top by 7mm
    // (after the +15 shift to the circle's anchor), an amount that doesn't already line up with
    // the grid, so only an explicit grid-snap on the cell's own margin would land the circle's
    // edges on a 10mm line.
    const overflowingContour: Vec2[][] = [
      [
        [-22, -8],
        [47, -8],
        [47, 22],
        [-22, 22],
      ],
    ];
    const items = [
      { shape: arcShape, baseContours: overflowingContour, reliefComponents: [], copies: 4 },
    ];

    const { svg } = buildContactSheetSvg(items, 2, colorGroups);

    const circleCenters = [...svg.matchAll(/cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)].map(([, x, y]) => [
      Number(x),
      Number(y),
    ]);

    expect(circleCenters).toHaveLength(4);

    for (const [cx, cy] of circleCenters) {
      // The circle's own local footprint is exactly 30mm (already a clean 3-grid-square size),
      // so its edges (cx +/- 15, cy +/- 15) land on the grid whenever cx and cy themselves sit
      // 15mm off a grid line.
      expect((cx - 15) % GRID_STEP_MM).toBeCloseTo(0);
      expect((cy - 15) % GRID_STEP_MM).toBeCloseTo(0);
    }
  });

  it("omits the base-reference circle for disc-shaped items", () => {
    const items = [
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
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

    // Cell: 10mm content + 2*2mm padding = 14mm, rounded up to the 20mm grid-vertex step, so the
    // full cell is 20x20: a marker sized to that would be twice the item's own 10x10 content.
    // Centered in that cell, the content's own tight box sits at (5,5)-(15,15).
    expect(svg).toContain(
      '<rect x="5" y="5" width="10" height="10" fill="none" stroke="#ff6b6b" stroke-width="0.6" stroke-dasharray="2 1" />',
    );
  });

  it("leaves an item with no valid flag unmarked", () => {
    const items = [
      { shape: discShape, baseContours: squareContour(10), reliefComponents: [], copies: 1 },
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
