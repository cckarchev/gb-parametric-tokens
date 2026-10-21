import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import { computePlateLayout, type PlateLayoutItem } from "./computePlateLayout";

// A token whose geometry is centered on its own origin, like every disc.
const centeredDisc = (diameterMm: number, copies: number): PlateLayoutItem => {
  const radiusMm = diameterMm / 2;

  return {
    shapeType: "disc",
    boundsMm: { min: [-radiusMm, -radiusMm], max: [radiusMm, radiusMm] },
    copies,
  };
};

// An arc token: its ribbon sits well above its own origin.
const offsetArc = (copies: number): PlateLayoutItem => ({
  shapeType: "arc",
  boundsMm: { min: [-45, 20], max: [45, 60] },
  copies,
});

// Where an item's bounds land once an offset moves it.
const placedBounds = (item: PlateLayoutItem, offset: Vec2) => ({
  min: [item.boundsMm.min[0] + offset[0], item.boundsMm.min[1] + offset[1]],
  max: [item.boundsMm.max[0] + offset[0], item.boundsMm.max[1] + offset[1]],
});

describe("computePlateLayout", () => {
  it("returns an empty array for no items", () => {
    expect(computePlateLayout([], 5)).toEqual([]);
  });

  it("gives an item with zero copies an empty offset list without breaking the layout", () => {
    expect(computePlateLayout([centeredDisc(25, 0)], 5)).toEqual([[]]);
  });

  it("arranges copies left to right, then in rows growing toward -y, so the first copy sits top-left as in the preview", () => {
    const result = computePlateLayout([centeredDisc(25, 3)], 5);
    const [first, second, third] = result[0];

    // Cells are 25 + 5 apart.
    expect(second[0] - first[0]).toBe(30);
    expect(second[1]).toBe(first[1]);
    expect(third[0]).toBe(first[0]);
    expect(third[1] - first[1]).toBe(-30);
  });

  it("places a token by its real bounds, not its origin, so geometry offset from the origin still lands in its cell", () => {
    const arc = offsetArc(1);

    const [[offset]] = computePlateLayout([arc], 5);

    expect(placedBounds(arc, offset)).toEqual({ min: [0, 0], max: [90, 40] });
  });

  it("places the disc block below the arc block, not interleaved", () => {
    const arc = offsetArc(1);
    const disc = centeredDisc(25, 1);

    const result = computePlateLayout([arc, disc], 5);
    const arcBounds = placedBounds(arc, result[0][0]);
    const discBounds = placedBounds(disc, result[1][0]);

    // One spacing gap between the arc's bottom edge and the disc's top edge.
    expect(arcBounds.min[1] - discBounds.max[1]).toBeCloseTo(5);
  });

  it("keeps arc items grouped together even when a disc item is listed first", () => {
    const disc = centeredDisc(25, 1);
    const arc = offsetArc(1);

    const result = computePlateLayout([disc, arc], 5);
    const arcBounds = placedBounds(arc, result[1][0]);
    const discBounds = placedBounds(disc, result[0][0]);

    expect(arcBounds.min[1]).toBeGreaterThan(discBounds.max[1]);
  });

  it("gives discs of different sizes their own blocks, and a large disc never overlaps the block above it", () => {
    const small = centeredDisc(15, 4);
    const large = centeredDisc(76.2, 1);

    const result = computePlateLayout([small, large], 5);
    const [first, second, third] = result[0];

    // The small discs pack at their own 15 + 5 pitch in a 2x2 grid...
    expect(second[0] - first[0]).toBe(20);
    expect(third[1] - first[1]).toBe(-20);

    // ...and the large disc's top edge starts one spacing gap below their lowest edge.
    const lowestSmallEdgeY = Math.min(
      ...result[0].map((offset) => placedBounds(small, offset).min[1]),
    );
    const largeTopEdgeY = placedBounds(large, result[1][0]).max[1];

    expect(lowestSmallEdgeY - largeTopEdgeY).toBeCloseTo(5);
  });

  it("puts tokens whose measured bounds differ only by float noise in the same block", () => {
    const first = centeredDisc(25, 1);
    const second: PlateLayoutItem = {
      shapeType: "disc",
      boundsMm: { min: [-12.5, -12.5], max: [12.500001, 12.5] },
      copies: 1,
    };

    const result = computePlateLayout([first, second], 5);

    expect(result[1][0][1]).toBeCloseTo(result[0][0][1]);
  });

  it("keeps the whole plate on the positive quadrant, its lowest edge on y = 0, where a slicer bed starts", () => {
    const arc = offsetArc(1);
    const disc = centeredDisc(25, 3);

    const result = computePlateLayout([arc, disc], 5);
    const allPlaced = [
      placedBounds(arc, result[0][0]),
      ...result[1].map((offset) => placedBounds(disc, offset)),
    ];
    const lowestY = Math.min(...allPlaced.map((bounds) => bounds.min[1]));
    const leftmostX = Math.min(...allPlaced.map((bounds) => bounds.min[0]));

    expect(lowestY).toBeCloseTo(0);
    expect(leftmostX).toBeCloseTo(0);
  });
});
