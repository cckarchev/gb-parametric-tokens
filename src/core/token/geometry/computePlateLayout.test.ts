import { describe, expect, it } from "vitest";

import { computePlateLayout } from "./computePlateLayout";

describe("computePlateLayout", () => {
  it("returns an empty array for no items", () => {
    expect(computePlateLayout([], 5)).toEqual([]);
  });

  it("gives an item with zero copies an empty offset list without breaking the layout", () => {
    const result = computePlateLayout(
      [{ shapeType: "disc", footprintMm: { width: 25, height: 25 }, copies: 0 }],
      5,
    );

    expect(result).toEqual([[]]);
  });

  it("arranges copies of a single item in a square-ish grid", () => {
    const result = computePlateLayout(
      [{ shapeType: "disc", footprintMm: { width: 25, height: 25 }, copies: 3 }],
      5,
    );

    expect(result).toEqual([
      [
        [0, 0],
        [30, 0],
        [0, 30],
      ],
    ]);
  });

  it("places the disc block below the arc block, not interleaved", () => {
    const result = computePlateLayout(
      [
        { shapeType: "arc", footprintMm: { width: 90, height: 40 }, copies: 1 },
        { shapeType: "disc", footprintMm: { width: 25, height: 25 }, copies: 1 },
      ],
      5,
    );

    expect(result[0]).toEqual([[0, 0]]);
    expect(result[1]).toEqual([[0, 45]]); // arc block height = 40 + 5 spacing
  });

  it("keeps arc items grouped together even when a disc item is listed first", () => {
    const result = computePlateLayout(
      [
        { shapeType: "disc", footprintMm: { width: 25, height: 25 }, copies: 1 },
        { shapeType: "arc", footprintMm: { width: 90, height: 40 }, copies: 1 },
      ],
      5,
    );

    expect(result[1]).toEqual([[0, 0]]); // the arc item, placed first despite being listed second
    expect(result[0]).toEqual([[0, 45]]); // the disc item, placed below
  });

  it("gives discs of different sizes their own blocks, so one large disc never widens the small ones", () => {
    const result = computePlateLayout(
      [
        { shapeType: "disc", footprintMm: { width: 15, height: 15 }, copies: 4 },
        { shapeType: "disc", footprintMm: { width: 76.2, height: 76.2 }, copies: 1 },
      ],
      5,
    );

    // The small discs pack at their own 15 + 5 pitch in a 2x2 grid...
    expect(result[0]).toEqual([
      [0, 0],
      [20, 0],
      [0, 20],
      [20, 20],
    ]);
    // ...and the large disc starts below their block (2 rows x 20mm).
    expect(result[1]).toEqual([[0, 40]]);
  });
});
