import { describe, expect, it } from "vitest";

import { flipItem } from "./flip";
import type { ContactSheetItem } from "./types";

describe("flipItem", () => {
  const item: ContactSheetItem = {
    shape: { type: "disc", diameterMm: 10 },
    baseContours: [[[1, 2]]],
    reliefComponents: [
      { source: { kind: "decoration" }, contours: [[[3, 4]]] },
      {
        source: { kind: "decoration" },
        contours: [[[5, 6]]],
        colorGroup: "text",
      },
      {
        source: { kind: "decoration" },
        contours: [[[7, 8]]],
        colorGroup: "text",
      },
    ],
    copies: 2,
    label: "Tapper: Commanding Aura",
    valid: false,
    reason: "Too thin.",
  };

  it("mirrors every contour top to bottom for SVG's downward y axis", () => {
    const flipped = flipItem(item);

    expect(flipped.baseContours).toEqual([[[1, -2]]]);
    expect(flipped.reliefContoursByColorGroup.get("text")).toEqual([
      [[5, -6]],
      [[7, -8]],
    ]);
  });

  it("groups the relief by color group, an untagged component going to the base group", () => {
    const flipped = flipItem(item);

    expect([...flipped.reliefContoursByColorGroup.keys()]).toEqual([
      "base",
      "text",
    ]);
    expect(flipped.reliefContoursByColorGroup.get("base")).toEqual([[[3, -4]]]);
  });

  it("carries the item's identity and validity through", () => {
    const flipped = flipItem(item);

    expect(flipped.shape).toBe(item.shape);
    expect(flipped.label).toBe(item.label);
    expect(flipped.valid).toBe(false);
    expect(flipped.reason).toBe(item.reason);
  });
});
