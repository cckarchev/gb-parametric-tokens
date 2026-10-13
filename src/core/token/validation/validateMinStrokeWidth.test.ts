import { describe, expect, it } from "vitest";

import {
  describeComponentFailure,
  describeVanishedDetailCount,
  validateMinStrokeWidth,
} from "./validateMinStrokeWidth";

describe("validateMinStrokeWidth", () => {
  it("fails a bar thinner than the minimum stroke width", async () => {
    const thinBar = [
      [
        [0, 0],
        [10, 0],
        [10, 0.2],
        [0, 0.2],
      ],
    ] as [number, number][][];

    const result = await validateMinStrokeWidth(thinBar, 0.45);

    expect(result.valid).toBe(false);
    expect(result.featureCount).toBe(1);
    expect(result.vanishedFeatureCount).toBe(1);
  });

  it("passes a bar at least as thick as the minimum stroke width", async () => {
    const thickBar = [
      [
        [0, 0],
        [10, 0],
        [10, 2],
        [0, 2],
      ],
    ] as [number, number][][];

    const result = await validateMinStrokeWidth(thickBar, 0.45);

    expect(result.valid).toBe(true);
    expect(result.featureCount).toBe(1);
    expect(result.vanishedFeatureCount).toBe(0);
  });

  // A real token composes chunky icons with hairline-thin text. A whole-union
  // "is anything left after erosion" check always passes, because the icons survive and
  // hide the vanished glyph, so the check has to look at each feature on its own.
  it("fails when one feature vanishes even though a thick neighbour survives", async () => {
    const thickSquareAndHairline = [
      [
        [0, 0],
        [16, 0],
        [16, 16],
        [0, 16],
      ],
      [
        [20, 0],
        [30, 0],
        [30, 0.08],
        [20, 0.08],
      ],
    ] as [number, number][][];

    const result = await validateMinStrokeWidth(thickSquareAndHairline, 0.45);

    expect(result.featureCount).toBe(2);
    expect(result.vanishedFeatureCount).toBe(1);
    expect(result.valid).toBe(false);
  });

  // Erosion routinely splits a real glyph into several pieces, so a "fewer pieces than
  // before" test would call this pair valid: the dumbbell splits at its 0.2mm neck and its
  // two lobes replace the count the vanished hairline took away (measured: 2 pieces before,
  // 2 pieces after). Eroding each feature on its own is not fooled.
  it("fails a vanished feature even when another feature splits into more pieces", async () => {
    const dumbbellAndHairline = [
      [
        [0, 0],
        [10, 0],
        [10, 4],
        [5.1, 4],
        [5.1, 4.2],
        [10, 4.2],
        [10, 8],
        [0, 8],
        [0, 4.2],
        [4.9, 4.2],
        [4.9, 4],
        [0, 4],
      ],
      [
        [20, 0],
        [30, 0],
        [30, 0.08],
        [20, 0.08],
      ],
    ] as [number, number][][];

    const result = await validateMinStrokeWidth(dumbbellAndHairline, 0.45);

    expect(result.featureCount).toBe(2);
    expect(result.vanishedFeatureCount).toBe(1);
    expect(result.valid).toBe(false);
  });
});

describe("describeComponentFailure", () => {
  it("names the failing text line by its own content, pluralized", () => {
    const message = describeComponentFailure({
      kind: "stroke-width",
      source: { kind: "text", text: "Thousand Cuts" },
      vanishedFeatureCount: 2,
      featureCount: 5,
    });

    expect(message).toBe('Text "Thousand Cuts": 2 of 5 details too thin to print at this size.');
  });

  it("names the failing icon by its own id", () => {
    const message = describeComponentFailure({
      kind: "stroke-width",
      source: { kind: "icon", iconId: "axe" },
      vanishedFeatureCount: 1,
      featureCount: 3,
    });

    expect(message).toBe('Icon "axe": 1 of 3 details too thin to print at this size.');
  });

  it("names a failing decoration generically, since it has no id or text of its own", () => {
    const message = describeComponentFailure({
      kind: "stroke-width",
      source: { kind: "decoration" },
      vanishedFeatureCount: 1,
      featureCount: 1,
    });

    expect(message).toBe("Decoration: 1 of 1 detail too thin to print at this size.");
  });

  it("falls back to a generic label for a component with no known source", () => {
    const message = describeComponentFailure({
      kind: "stroke-width",
      source: { kind: "unknown" },
      vanishedFeatureCount: 1,
      featureCount: 2,
    });

    expect(message).toBe("This detail: 1 of 2 details too thin to print at this size.");
  });

  it("uses the singular for a single detail", () => {
    const message = describeComponentFailure({
      kind: "stroke-width",
      source: { kind: "text", text: "L" },
      vanishedFeatureCount: 1,
      featureCount: 1,
    });

    expect(message).toBe('Text "L": 1 of 1 detail too thin to print at this size.');
  });

  it("names the failing icon by its own id when it overflows its target circle", () => {
    const message = describeComponentFailure({
      kind: "icon-overflow",
      source: { kind: "icon", iconId: "cooks" },
    });

    expect(message).toBe(
      'Icon "cooks": extends past its circle and nothing corrects it -- see "Icons that overflow their circle".',
    );
  });
});

describe("describeComponentFailure, layout failures", () => {
  it("names the text that runs past the token's edge", () => {
    const message = describeComponentFailure({
      kind: "outside-footprint",
      source: { kind: "text", text: "Smoke Bomb" },
    });

    expect(message).toBe('Text "Smoke Bomb": runs past the token\'s edge.');
  });

  it("names both the crest and the text it overlaps", () => {
    const message = describeComponentFailure({
      kind: "crest-over-text",
      source: { kind: "icon", iconId: "Brewers" },
      textSource: { kind: "text", text: "Goal" },
    });

    expect(message).toBe('Icon "Brewers" overlaps Text "Goal".');
  });

  it("explains a broken outline without naming a component", () => {
    const message = describeComponentFailure({ kind: "broken-footprint", pieceCount: 2 });

    expect(message).toBe(
      "The token's outline came out empty or in separate pieces: check its shape settings.",
    );
  });
});

describe("describeVanishedDetailCount", () => {
  it("gives just the count, with no source label -- for when the caller already names the source", () => {
    const message = describeVanishedDetailCount({ vanishedFeatureCount: 2, featureCount: 5 });

    expect(message).toBe("2 of 5 details too thin to print at this size.");
  });

  it("uses the singular for a single detail", () => {
    const message = describeVanishedDetailCount({ vanishedFeatureCount: 1, featureCount: 1 });

    expect(message).toBe("1 of 1 detail too thin to print at this size.");
  });
});
