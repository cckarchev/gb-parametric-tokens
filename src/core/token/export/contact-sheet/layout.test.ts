import { describe, expect, it } from "vitest";

import { layoutPreparedSection } from "./layout";
import { FlippedContactSheetItem, PreparedSection } from "./types";

const CELL_SIZE_MM = 20;
const CELL_PADDING_MM = 2;
const ITEM_SIZE_MM = 10;

const disc = (overrides: Partial<FlippedContactSheetItem> = {}): FlippedContactSheetItem => {
  return {
    shape: { type: "disc", diameterMm: ITEM_SIZE_MM },
    baseContours: [
      [
        [0, 0],
        [ITEM_SIZE_MM, 0],
        [ITEM_SIZE_MM, ITEM_SIZE_MM],
      ],
    ],
    reliefContoursByColorGroup: new Map(),
    ...overrides,
  };
};

const prepare = (items: FlippedContactSheetItem[], alignToGridVertex: boolean): PreparedSection => {
  return {
    flippedItems: items,
    boundsByItem: items.map(() => ({ min: [0, 0], max: [ITEM_SIZE_MM, ITEM_SIZE_MM] })),
    cellWidthMm: CELL_SIZE_MM,
    cellHeightMm: CELL_SIZE_MM,
    cellPaddingMm: CELL_PADDING_MM,
    arcLeftMarginMm: 0,
    arcTopMarginMm: 0,
    alignToGridVertex,
  };
};

const markerRects = (xml: string): string[] => {
  return [...xml.matchAll(/<rect x="([^"]+)" y="([^"]+)"/g)].map(
    (match) => `${match[1]},${match[2]}`,
  );
};

describe("layoutPreparedSection", () => {
  it("wraps items into rows of the given column count", () => {
    const items = [disc(), disc(), disc()];

    const layout = layoutPreparedSection(prepare(items, true), 2, 0, []);

    expect(layout.widthMm).toBe(2 * CELL_SIZE_MM);
    expect(layout.heightMm).toBe(2 * CELL_SIZE_MM);
  });

  it("is only as wide as its items when there are fewer items than columns", () => {
    const layout = layoutPreparedSection(prepare([disc()], true), 5, 0, []);

    expect(layout.widthMm).toBe(CELL_SIZE_MM);
  });

  it("centers a grid-vertex disc in its cell, and marks only the invalid items", () => {
    const items = [disc(), disc({ valid: false, label: "Tapper", reason: "Too thin." })];

    const layout = layoutPreparedSection(prepare(items, true), 2, 0, []);

    // The second cell starts at x=20; a centered 10mm item sits 5mm in, at x=25. The vertical
    // origin passed in (0) plus the same 5mm gives y=5.
    expect(markerRects(layout.cellsXml)).toEqual(["25,5"]);
    expect(layout.cellsXml).toContain("<title>Tapper: Too thin.</title>");
  });

  it("places an unaligned disc at the cell's padding, below the given vertical origin", () => {
    const items = [disc({ valid: false, label: "Tapper", reason: "Too thin." })];
    const originYMm = 40;

    const layout = layoutPreparedSection(prepare(items, false), 1, originYMm, []);

    expect(markerRects(layout.cellsXml)).toEqual([
      `${CELL_PADDING_MM},${originYMm + CELL_PADDING_MM}`,
    ]);
  });

  it("falls back to a generic label and reason when an invalid item has neither", () => {
    const items = [disc({ valid: false, reason: "" })];

    const layout = layoutPreparedSection(prepare(items, true), 1, 0, []);

    expect(layout.cellsXml).toContain(
      "<title>This token: This detail is thinner than the minimum printable stroke width.</title>",
    );
  });
});
