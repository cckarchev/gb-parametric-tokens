import { describe, expect, it } from "vitest";

import { deriveReliefColor } from "./deriveReliefColor";

describe("deriveReliefColor", () => {
  it("picks white for a near-black base (Morticians, luminance 0.014 per SPEC §9)", () => {
    expect(deriveReliefColor("#1d2022")).toBe("#FFFFFF");
  });

  it("picks black for a bright base (Order, luminance 0.783 per SPEC §9)", () => {
    expect(deriveReliefColor("#ebed1a")).toBe("#000000");
  });

  it("picks black for a mid-luminance base above the ~0.2 threshold (Brewers, 0.453)", () => {
    expect(deriveReliefColor("#cdb320")).toBe("#000000");
  });

  it("picks white for a base just under the ~0.2 threshold (Butchers, 0.142)", () => {
    expect(deriveReliefColor("#ce1f27")).toBe("#FFFFFF");
  });

  it("picks black for a base just over the ~0.2 threshold (Alchemists, 0.228)", () => {
    expect(deriveReliefColor("#4e9339")).toBe("#000000");
  });
});
