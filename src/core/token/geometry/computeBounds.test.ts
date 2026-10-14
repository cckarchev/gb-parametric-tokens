import { describe, expect, it } from "vitest";

import { computeBounds } from "./computeBounds";

describe("computeBounds", () => {
  it("spans every point of every contour", () => {
    const bounds = computeBounds([
      [
        [1, 2],
        [4, -3],
      ],
      [[-5, 7]],
    ]);

    expect(bounds).toEqual({ min: [-5, -3], max: [4, 7] });
  });
});
