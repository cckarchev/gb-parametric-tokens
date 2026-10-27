import { describe, expect, it } from "vitest";

import { normalizeAngleDeg } from "./angleConventions";

describe("normalizeAngleDeg", () => {
  it.each([
    {
      description: "keeps an angle already in 0..360",
      angleDeg: 90,
      expectedDeg: 90,
    },
    { description: "keeps zero", angleDeg: 0, expectedDeg: 0 },
    {
      description: "wraps a full turn back to zero",
      angleDeg: 360,
      expectedDeg: 0,
    },
    {
      description: "wraps an angle past a full turn",
      angleDeg: 450,
      expectedDeg: 90,
    },
    { description: "wraps a negative angle", angleDeg: -90, expectedDeg: 270 },
    {
      description: "wraps an angle more than a full turn negative",
      angleDeg: -450,
      expectedDeg: 270,
    },
  ])("$description", ({ angleDeg, expectedDeg }) => {
    expect(normalizeAngleDeg(angleDeg)).toBe(expectedDeg);
  });
});
