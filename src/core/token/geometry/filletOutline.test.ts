import { describe, expect, it } from "vitest";

import { getManifoldModule } from "../mesh/manifoldModule";
import { filletOutline } from "./filletOutline";

const CIRCLE_SEGMENTS = 64;

describe("filletOutline", () => {
  it("fills the concave notch between two overlapping circles", async () => {
    const wasm = await getManifoldModule();
    const { CrossSection } = wasm;

    // Two same-size circles far enough apart to stay distinct bodies but close enough to
    // overlap: their union has a concave notch on each side of the overlap, the same shape
    // as where an arc token's ribbon meets its stud.
    const left = CrossSection.circle(5, CIRCLE_SEGMENTS);
    const right = CrossSection.circle(5, CIRCLE_SEGMENTS).translate(7, 0);
    const peanut = left.add(right);

    const filleted = filletOutline(peanut, 3);

    // The two circles' boundaries cross at x=3.5, y=+-sqrt(5^2 - 3.5^2) ~= 3.57. Just beyond
    // that crossing, along the perpendicular bisector, sits the concave notch itself: outside
    // the original union but inside the filleted one once the notch is smoothed over.
    const notchProbe = CrossSection.circle(0.05, 16).translate(3.5, 3.9);

    expect(peanut.intersect(notchProbe).isEmpty()).toBe(true);
    expect(filleted.intersect(notchProbe).isEmpty()).toBe(false);
  });

  it("leaves an isolated convex shape's area unchanged", async () => {
    const wasm = await getManifoldModule();
    const { CrossSection } = wasm;

    const circle = CrossSection.circle(10, CIRCLE_SEGMENTS);
    const filleted = filletOutline(circle, 2);

    expect(filleted.area()).toBeCloseTo(circle.area(), 1);
  });

  it("leaves the shape unchanged for a zero radius", async () => {
    const wasm = await getManifoldModule();
    const { CrossSection } = wasm;

    const circle = CrossSection.circle(10, CIRCLE_SEGMENTS);
    const filleted = filletOutline(circle, 0);

    expect(filleted.area()).toBeCloseTo(circle.area(), 1);
  });
});
