import { describe, expect, it } from "vitest";

import { computeRadialTextRotationDeg } from "./radialTextRotation";

describe("computeRadialTextRotationDeg", () => {
  it("reads a line along a spoke pointing up from the bottom to the top", () => {
    expect(computeRadialTextRotationDeg(90)).toBe(90);
  });

  it("reads a line along a lower right spoke outward, already upright enough", () => {
    expect(computeRadialTextRotationDeg(330)).toBe(330);
  });

  it("turns a line along a lower left spoke around so it never reads upside down", () => {
    expect(computeRadialTextRotationDeg(210)).toBe(30);
  });

  it("turns a line along a spoke pointing straight down to read bottom to top", () => {
    expect(computeRadialTextRotationDeg(270)).toBe(90);
  });

  it("accepts angles outside a single turn", () => {
    expect(computeRadialTextRotationDeg(-30)).toBe(330);
    expect(computeRadialTextRotationDeg(570)).toBe(30);
  });
});
