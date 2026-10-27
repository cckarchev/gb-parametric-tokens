import { describe, expect, it } from "vitest";

import { computeBounds } from "./computeBounds";

describe("computeBounds", () => {
  it("spans every point of every contour", () => {
    const minX = -5;
    const maxX = 4;
    const minY = -3;
    const maxY = 7;
    const bounds = computeBounds([
      [
        [1, 2],
        [maxX, minY],
      ],
      [[minX, maxY]],
    ]);

    expect(bounds).toEqual({ min: [minX, minY], max: [maxX, maxY] });
  });
});
