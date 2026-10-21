import { describe, expect, it } from "vitest";

import type { ReliefComponent } from "../mesh/reliefComponent";
import type { Vec2 } from "../types";
import { validateLayoutGeometry } from "./validateLayoutGeometry";

const square = (minX: number, minY: number, size: number): Vec2[] => [
  [minX, minY],
  [minX + size, minY],
  [minX + size, minY + size],
  [minX, minY + size],
];

const FOOTPRINT = [square(0, 0, 10)];

const text = (contour: Vec2[]): ReliefComponent => ({
  contours: [contour],
  source: { kind: "text", text: "Name" },
});

const icon = (contour: Vec2[]): ReliefComponent => ({
  contours: [contour],
  source: { kind: "icon", iconId: "Brewers" },
});

describe("validateLayoutGeometry", () => {
  it("passes text and icons that sit inside the footprint apart from each other", async () => {
    const failures = await validateLayoutGeometry(
      [text(square(1, 1, 2)), icon(square(5, 5, 2))],
      FOOTPRINT,
    );

    expect(failures).toEqual([]);
  });

  it("flags text that runs past the footprint's edge", async () => {
    const failures = await validateLayoutGeometry(
      [text(square(9, 1, 2))],
      FOOTPRINT,
    );

    expect(failures).toEqual([
      { kind: "outside-footprint", source: { kind: "text", text: "Name" } },
    ]);
  });

  it("flags a decoration past the edge too, but leaves icons to their own overflow check", async () => {
    const decoration: ReliefComponent = {
      contours: [square(9, 5, 2)],
      source: { kind: "decoration" },
    };
    const failures = await validateLayoutGeometry(
      [decoration, icon(square(9, 1, 2))],
      FOOTPRINT,
    );

    expect(failures).toEqual([
      { kind: "outside-footprint", source: { kind: "decoration" } },
    ]);
  });

  it("flags text that falls into a hole of the footprint", async () => {
    const ring = [square(0, 0, 10), square(3, 3, 4).reverse()];
    const failures = await validateLayoutGeometry(
      [text(square(4, 4, 2))],
      ring,
    );

    expect(failures.map((failure) => failure.kind)).toEqual([
      "outside-footprint",
    ]);
  });

  it("flags a crest that overlaps text", async () => {
    const failures = await validateLayoutGeometry(
      [text(square(1, 1, 3)), icon(square(2, 2, 3))],
      FOOTPRINT,
    );

    expect(failures).toEqual([
      {
        kind: "crest-over-text",
        source: { kind: "icon", iconId: "Brewers" },
        textSource: { kind: "text", text: "Name" },
      },
    ]);
  });

  it("flags a footprint that came out in separate pieces or empty", async () => {
    const split = await validateLayoutGeometry(
      [],
      [square(0, 0, 2), square(5, 5, 2)],
    );
    const empty = await validateLayoutGeometry([], []);

    expect(split).toEqual([{ kind: "broken-footprint", pieceCount: 2 }]);
    expect(empty).toEqual([{ kind: "broken-footprint", pieceCount: 0 }]);
  });
});
