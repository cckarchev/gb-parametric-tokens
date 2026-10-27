import { describe, expect, it } from "vitest";
import type { Vec2 } from "../../types";
import { flipItem } from "./flip";
import type { ContactSheetItem } from "./types";

// One single-point contour per part, each at its own spot so a mix-up shows.
const POINTS = {
  base: { x: 1, y: 2 },
  untagged: { x: 3, y: 4 },
  firstText: { x: 5, y: 6 },
  secondText: { x: 7, y: 8 },
};

type Point = { x: number; y: number };

const contourAt = ({ x, y }: Point): Vec2[][] => [[[x, y]]];

const mirroredContourAt = ({ x, y }: Point): Vec2[][] => [[[x, -y]]];

describe("flipItem", () => {
  const item: ContactSheetItem = {
    shape: { type: "disc", diameterMm: 10 },
    baseContours: contourAt(POINTS.base),
    reliefComponents: [
      { source: { kind: "decoration" }, contours: contourAt(POINTS.untagged) },
      {
        source: { kind: "decoration" },
        contours: contourAt(POINTS.firstText),
        colorGroup: "text",
      },
      {
        source: { kind: "decoration" },
        contours: contourAt(POINTS.secondText),
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

    expect(flipped.baseContours).toEqual(mirroredContourAt(POINTS.base));
    expect(flipped.reliefContoursByColorGroup.get("text")).toEqual([
      ...mirroredContourAt(POINTS.firstText),
      ...mirroredContourAt(POINTS.secondText),
    ]);
  });

  it("groups the relief by color group, an untagged component going to the base group", () => {
    const flipped = flipItem(item);

    expect([...flipped.reliefContoursByColorGroup.keys()]).toEqual([
      "base",
      "text",
    ]);
    expect(flipped.reliefContoursByColorGroup.get("base")).toEqual(
      mirroredContourAt(POINTS.untagged),
    );
  });

  it("carries the item's identity and validity through", () => {
    const flipped = flipItem(item);

    expect(flipped.shape).toBe(item.shape);
    expect(flipped.label).toBe(item.label);
    expect(flipped.valid).toBe(false);
    expect(flipped.reason).toBe(item.reason);
  });
});
