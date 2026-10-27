import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import { groupReliefComponentsByColorGroup } from "./groupReliefComponents";

const square = (x: number): Vec2[][] => [
  [
    [x, 0],
    [x + 1, 0],
    [x + 1, 1],
    [x, 1],
  ],
];

// Squares at x = 0, 2 and 4, one unit wide, so none of them overlap.
const THIRD_SQUARE_X = 4;

describe("groupReliefComponentsByColorGroup", () => {
  it("puts untagged components under the reserved base id", () => {
    const grouped = groupReliefComponentsByColorGroup([
      { source: { kind: "decoration" }, contours: square(0) },
    ]);

    expect([...grouped.keys()]).toEqual(["base"]);
    expect(grouped.get("base")).toEqual(square(0));
  });

  it("keeps distinct colorGroups separate and concatenates same-group contours", () => {
    const grouped = groupReliefComponentsByColorGroup([
      {
        source: { kind: "decoration" },
        contours: square(0),
        colorGroup: "accent",
      },
      { source: { kind: "decoration" }, contours: square(2) },
      {
        source: { kind: "decoration" },
        contours: square(THIRD_SQUARE_X),
        colorGroup: "accent",
      },
    ]);

    expect([...grouped.keys()]).toEqual(["accent", "base"]);
    expect(grouped.get("accent")).toEqual([
      ...square(0),
      ...square(THIRD_SQUARE_X),
    ]);
    expect(grouped.get("base")).toEqual(square(2));
  });
});
