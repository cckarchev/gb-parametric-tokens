import { describe, expect, it } from "vitest";

import { describeTokenFailures } from "./describeTokenFailures";

describe("describeTokenFailures", () => {
  it("drops the source label when the only failing text is the token's own name", () => {
    const reason = describeTokenFailures("Token B", [
      {
        kind: "stroke-width",
        source: { kind: "text", text: "Token B" },
        vanishedFeatureCount: 1,
        featureCount: 1,
      },
    ]);

    expect(reason).toBe("1 of 1 detail too thin to print at this size.");
  });

  it("keeps the source label when the failing component isn't the token's own name (an icon, or a second line worded differently)", () => {
    const reason = describeTokenFailures("Token A", [
      {
        kind: "stroke-width",
        source: { kind: "icon", iconId: "axe" },
        vanishedFeatureCount: 1,
        featureCount: 2,
      },
      {
        kind: "stroke-width",
        source: { kind: "text", text: "A second line" },
        vanishedFeatureCount: 3,
        featureCount: 4,
      },
    ]);

    expect(reason).toBe(
      'Icon "axe": 1 of 2 details too thin to print at this size.\n' +
        'Text "A second line": 3 of 4 details too thin to print at this size.',
    );
  });

  it("collapses two identically-worded failures into one line, e.g. a left and right stud icon that are the same icon and fail the same way", () => {
    const reason = describeTokenFailures("Singled Out", [
      {
        kind: "stroke-width",
        source: { kind: "icon", iconId: "Cooks" },
        vanishedFeatureCount: 3,
        featureCount: 11,
      },
      {
        kind: "stroke-width",
        source: { kind: "icon", iconId: "Cooks" },
        vanishedFeatureCount: 3,
        featureCount: 11,
      },
      {
        kind: "stroke-width",
        source: { kind: "text", text: "Singled Out" },
        vanishedFeatureCount: 9,
        featureCount: 11,
      },
    ]);

    expect(reason).toBe(
      'Icon "Cooks": 3 of 11 details too thin to print at this size.\n' +
        "9 of 11 details too thin to print at this size.",
    );
  });

  it("names the overflowing icon when it extends past its target circle", () => {
    const reason = describeTokenFailures("Token A", [
      { kind: "icon-overflow", source: { kind: "icon", iconId: "Cooks" } },
    ]);

    expect(reason).toBe(
      'Icon "Cooks": extends past its circle and nothing corrects it. See "Icons that overflow their circle".',
    );
  });

  it("is empty when nothing failed", () => {
    expect(describeTokenFailures("Token A", [])).toBe("");
  });
});
