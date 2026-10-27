import { describe, expect, it } from "vitest";

import { computeRadialTextRotationDeg } from "./radialTextRotation";

describe("computeRadialTextRotationDeg", () => {
  it.each([
    {
      description:
        "reads a line along a spoke pointing up from the bottom to the top",
      spokeDeg: 90,
      expectedDeg: 90,
    },
    {
      description:
        "reads a line along a lower right spoke outward, already upright enough",
      spokeDeg: 330,
      expectedDeg: 330,
    },
    {
      description:
        "turns a line along a lower left spoke around so it never reads upside down",
      spokeDeg: 210,
      expectedDeg: 30,
    },
    {
      description:
        "turns a line along a spoke pointing straight down to read bottom to top",
      spokeDeg: 270,
      expectedDeg: 90,
    },
    {
      description: "accepts angles below a single turn",
      spokeDeg: -30,
      expectedDeg: 330,
    },
    {
      description: "accepts angles above a single turn",
      spokeDeg: 570,
      expectedDeg: 30,
    },
  ])("$description", ({ spokeDeg, expectedDeg }) => {
    expect(computeRadialTextRotationDeg(spokeDeg)).toBe(expectedDeg);
  });
});
