import { describe, expect, it } from "vitest";

import { resolveRingLineOrientation } from "./ringLineOrientation";

describe("resolveRingLineOrientation", () => {
  it("reads outward on the upper half, its edges included", () => {
    expect(resolveRingLineOrientation(90)).toBe("outward");
    expect(resolveRingLineOrientation(0)).toBe("outward");
    expect(resolveRingLineOrientation(180)).toBe("outward");
  });

  it("reads inward on the lower half, for any equivalent angle", () => {
    expect(resolveRingLineOrientation(210)).toBe("inward");
    expect(resolveRingLineOrientation(270)).toBe("inward");
    expect(resolveRingLineOrientation(-30)).toBe("inward");
    expect(resolveRingLineOrientation(690)).toBe("inward");
  });
});
