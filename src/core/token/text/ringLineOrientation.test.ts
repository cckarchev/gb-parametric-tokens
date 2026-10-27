import { describe, expect, it } from "vitest";

import { resolveRingLineOrientation } from "./ringLineOrientation";

describe("resolveRingLineOrientation", () => {
  it.each([{ angleDeg: 90 }, { angleDeg: 0 }, { angleDeg: 180 }])(
    "reads outward on the upper half, its edges included ($angleDeg°)",
    ({ angleDeg }) => {
      expect(resolveRingLineOrientation(angleDeg)).toBe("outward");
    },
  );

  it.each([
    { angleDeg: 210 },
    { angleDeg: 270 },
    { angleDeg: -30 },
    { angleDeg: 690 },
  ])(
    "reads inward on the lower half, for any equivalent angle ($angleDeg°)",
    ({ angleDeg }) => {
      expect(resolveRingLineOrientation(angleDeg)).toBe("inward");
    },
  );
});
