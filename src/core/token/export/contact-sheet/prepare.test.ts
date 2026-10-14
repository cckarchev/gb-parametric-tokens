import { describe, expect, it } from "vitest";

import { ShapeSpec, Vec2 } from "../../types";
import { groupDiscItemsByDiameter, prepareSection } from "./prepare";
import { FlippedContactSheetItem } from "./types";

const CELL_PADDING_MM = 2;
const ARC_SHAPE: ShapeSpec = {
  type: "arc",
  ribbonWidthMm: 6,
  ribbonLengthMm: 30,
  studDiameterMm: 12,
};

const squareContour = (minMm: number, maxMm: number): Vec2[] => {
  return [
    [minMm, minMm],
    [maxMm, minMm],
    [maxMm, maxMm],
    [minMm, maxMm],
  ];
};

const buildItem = (shape: ShapeSpec, baseContours: Vec2[][]): FlippedContactSheetItem => {
  return { shape, baseContours, reliefContoursByColorGroup: new Map() };
};

const disc = (diameterMm: number): FlippedContactSheetItem => {
  return buildItem({ type: "disc", diameterMm }, [squareContour(0, diameterMm)]);
};

describe("groupDiscItemsByDiameter", () => {
  it("groups discs by diameter, in the order each diameter first appears", () => {
    const small = disc(15);
    const large = disc(20);
    const otherSmall = disc(15);

    const groups = groupDiscItemsByDiameter([small, large, otherSmall]);

    expect(groups).toEqual([[small, otherSmall], [large]]);
  });
});

describe("prepareSection", () => {
  it("sizes a grid-vertex disc cell to the biggest item plus padding, rounded up to 20mm", () => {
    // Widest item 12mm + 2 * 2mm padding = 16mm, rounded up to the 20mm vertex step.
    const prepared = prepareSection([disc(10), disc(12)], CELL_PADDING_MM, true);

    expect(prepared.cellWidthMm).toBe(20);
    expect(prepared.cellHeightMm).toBe(20);
    expect(prepared.arcLeftMarginMm).toBe(0);
    expect(prepared.arcTopMarginMm).toBe(0);
  });

  it("makes an arc cell big enough for the base-reference circle even when the token is smaller", () => {
    // A tiny token still gets the 30mm circle's footprint: the left/top margin rounds padding up
    // to the 10mm grid (2 + 8), so the cell is 30 + 2 * 2 + 8 = 42, rounded up to 50.
    const tinyArc = buildItem(ARC_SHAPE, [squareContour(0, 1)]);

    const prepared = prepareSection([tinyArc], CELL_PADDING_MM, false);

    expect(prepared.arcLeftMarginMm).toBe(8);
    expect(prepared.arcTopMarginMm).toBe(8);
    expect(prepared.cellWidthMm).toBe(50);
    expect(prepared.cellHeightMm).toBe(50);
  });

  it("widens the shared arc margin for content reaching past the circle's left and top", () => {
    // Shifted onto the anchor (15, 15), the contour spans (-5, -5) to (20, 20): 5mm of overflow,
    // so padding plus margin rounds 2 + 5 up to 10, a margin of 8.
    const overflowingArc = buildItem(ARC_SHAPE, [squareContour(-20, 5)]);

    const prepared = prepareSection([overflowingArc], CELL_PADDING_MM, false);

    expect(prepared.boundsByItem[0]).toEqual({ min: [-5, -5], max: [30, 30] });
    expect(prepared.arcLeftMarginMm).toBe(8);
    // 35mm of content + 2 * 2 padding + 8 margin = 47, rounded up to 50.
    expect(prepared.cellWidthMm).toBe(50);
  });

  it("fits an arc cell to the token alone when the base-reference circle is hidden", () => {
    // Shifted onto the anchor (15, 15), the contour spans (13, 11) to (37, 19). Vertically the
    // cell is the 8mm of content plus 2 * 2mm padding, with no rounding. Horizontally the token's
    // axis stays on a grid line: 2mm left of it plus padding rounds up to 10, 22mm right of it
    // plus padding rounds up to 30.
    const arc = buildItem(ARC_SHAPE, [
      [
        [-2, -4],
        [22, -4],
        [22, 4],
        [-2, 4],
      ],
    ]);

    const prepared = prepareSection([arc], CELL_PADDING_MM, false, false);

    expect(prepared.cellWidthMm).toBe(40);
    expect(prepared.cellHeightMm).toBe(12);
    // The axis lands at padding + margin + anchor = 2 - 7 + 15 = 10, on the grid line.
    expect(prepared.arcLeftMarginMm).toBe(-7);
    // The top margin pulls the token's top back onto the padding.
    expect(prepared.arcTopMarginMm).toBe(-11);
  });

  it("spans every hidden-circle arc's extent, so differently placed tokens all fit one cell", () => {
    // Anchored, one spans x 10..20 and the other 15..30, so together they reach 5mm left of the
    // axis at 15 (rounds to 10 with padding) and 15mm right of it (rounds to 20).
    const left = buildItem(ARC_SHAPE, [squareContour(-5, 5)]);
    const right = buildItem(ARC_SHAPE, [squareContour(0, 15)]);

    const prepared = prepareSection([left, right], CELL_PADDING_MM, false, false);

    expect(prepared.cellWidthMm).toBe(30);
    expect(prepared.arcLeftMarginMm).toBe(-7);
  });
});
