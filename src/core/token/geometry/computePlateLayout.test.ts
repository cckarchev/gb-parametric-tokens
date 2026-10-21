import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import { computePlateLayout, type PlateLayoutItem } from "./computePlateLayout";

const SPACING_MM = 5;
const DISC_DIAMETER_MM = 25;
const DISC_RADIUS_MM = DISC_DIAMETER_MM / 2;
// An arc's ribbon: 90mm wide, from 20mm to 60mm above its own origin.
const ARC = { halfWidthMm: 45, bottomMm: 20, topMm: 60 };

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
  boundsMm: {
    min: [-ARC.halfWidthMm, ARC.bottomMm],
    max: [ARC.halfWidthMm, ARC.topMm],
  },
  copies,
});

// Where an item's bounds land once an offset moves it.
const placedBounds = (item: PlateLayoutItem, offset: Vec2) => ({
  min: [item.boundsMm.min[0] + offset[0], item.boundsMm.min[1] + offset[1]],
  max: [item.boundsMm.max[0] + offset[0], item.boundsMm.max[1] + offset[1]],
});

describe("computePlateLayout", () => {
  it("returns an empty array for no items", () => {
    expect(computePlateLayout([], SPACING_MM)).toEqual([]);
  });

  it("gives an item with zero copies an empty offset list without breaking the layout", () => {
    expect(
      computePlateLayout([centeredDisc(DISC_DIAMETER_MM, 0)], SPACING_MM),
    ).toEqual([[]]);
  });

  it("arranges copies left to right, then in rows growing toward -y, so the first copy sits top-left as in the preview", () => {
    const copies = 3;
    const result = computePlateLayout(
      [centeredDisc(DISC_DIAMETER_MM, copies)],
      SPACING_MM,
    );
    const [first, second, third] = result[0];
    const pitchMm = DISC_DIAMETER_MM + SPACING_MM;

    expect(second[0] - first[0]).toBe(pitchMm);
    expect(second[1]).toBe(first[1]);
    expect(third[0]).toBe(first[0]);
    expect(third[1] - first[1]).toBe(-pitchMm);
  });

  it("places a token by its real bounds, not its origin, so geometry offset from the origin still lands in its cell", () => {
    const arc = offsetArc(1);

    const [[offset]] = computePlateLayout([arc], SPACING_MM);

    expect(placedBounds(arc, offset)).toEqual({
      min: [0, 0],
      max: [ARC.halfWidthMm * 2, ARC.topMm - ARC.bottomMm],
    });
  });

  it("places the disc block below the arc block, not interleaved", () => {
    const arc = offsetArc(1);
    const disc = centeredDisc(DISC_DIAMETER_MM, 1);

    const result = computePlateLayout([arc, disc], SPACING_MM);
    const arcBounds = placedBounds(arc, result[0][0]);
    const discBounds = placedBounds(disc, result[1][0]);

    // One spacing gap between the arc's bottom edge and the disc's top edge.
    expect(arcBounds.min[1] - discBounds.max[1]).toBeCloseTo(SPACING_MM);
  });

  it("keeps arc items grouped together even when a disc item is listed first", () => {
    const disc = centeredDisc(DISC_DIAMETER_MM, 1);
    const arc = offsetArc(1);

    const result = computePlateLayout([disc, arc], SPACING_MM);
    const arcBounds = placedBounds(arc, result[1][0]);
    const discBounds = placedBounds(disc, result[0][0]);

    expect(arcBounds.min[1]).toBeGreaterThan(discBounds.max[1]);
  });
});

describe("computePlateLayout disc blocks", () => {
  it("gives discs of different sizes their own blocks, and a large disc never overlaps the block above it", () => {
    const smallDiameterMm = 15;
    const smallCopies = 4;
    const largeDiameterMm = 76.2;
    const small = centeredDisc(smallDiameterMm, smallCopies);
    const large = centeredDisc(largeDiameterMm, 1);

    const result = computePlateLayout([small, large], SPACING_MM);
    const [first, second, third] = result[0];

    // The small discs pack at their own 15 + 5 pitch in a 2x2 grid...
    const smallPitchMm = smallDiameterMm + SPACING_MM;

    expect(second[0] - first[0]).toBe(smallPitchMm);
    expect(third[1] - first[1]).toBe(-smallPitchMm);

    // ...and the large disc's top edge starts one spacing gap below their lowest edge.
    const lowestSmallEdgeY = Math.min(
      ...result[0].map((offset) => placedBounds(small, offset).min[1]),
    );
    const largeTopEdgeY = placedBounds(large, result[1][0]).max[1];

    expect(lowestSmallEdgeY - largeTopEdgeY).toBeCloseTo(SPACING_MM);
  });

  it("puts tokens whose measured bounds differ only by float noise in the same block", () => {
    const floatNoiseMm = 1e-6;
    const first = centeredDisc(DISC_DIAMETER_MM, 1);
    const second: PlateLayoutItem = {
      shapeType: "disc",
      boundsMm: {
        min: [-DISC_RADIUS_MM, -DISC_RADIUS_MM],
        max: [DISC_RADIUS_MM + floatNoiseMm, DISC_RADIUS_MM],
      },
      copies: 1,
    };

    const result = computePlateLayout([first, second], SPACING_MM);

    expect(result[1][0][1]).toBeCloseTo(result[0][0][1]);
  });
});

describe("computePlateLayout plate origin", () => {
  it("keeps the whole plate on the positive quadrant, its lowest edge on y = 0, where a slicer bed starts", () => {
    const discCopies = 3;
    const arc = offsetArc(1);
    const disc = centeredDisc(DISC_DIAMETER_MM, discCopies);

    const result = computePlateLayout([arc, disc], SPACING_MM);
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
