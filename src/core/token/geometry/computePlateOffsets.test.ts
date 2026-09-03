import { describe, expect, it } from "vitest";

import { computePlateOffsets } from "./computePlateOffsets";

describe("computePlateOffsets", () => {
  it("returns a single offset at the origin for one copy", () => {
    expect(computePlateOffsets({ count: 1, columns: 1, spacingMm: 10 })).toEqual([[0, 0]]);
  });

  it("fills a full grid row by row", () => {
    const offsets = computePlateOffsets({ count: 4, columns: 2, spacingMm: 10 });

    expect(offsets).toEqual([
      [0, 0],
      [10, 0],
      [0, 10],
      [10, 10],
    ]);
  });

  it("leaves the last row partially filled when count isn't a multiple of columns", () => {
    const offsets = computePlateOffsets({ count: 3, columns: 2, spacingMm: 5 });

    expect(offsets).toEqual([
      [0, 0],
      [5, 0],
      [0, 5],
    ]);
  });
});
