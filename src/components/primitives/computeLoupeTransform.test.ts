import { describe, expect, it } from "vitest";

import { CSS_PX_PER_MM, computeLoupeTransform } from "./computeLoupeTransform";

describe("computeLoupeTransform", () => {
  it("scales the content to true 1:1 physical size using the CSS 96dpi convention at zoomFactor 1", () => {
    const result = computeLoupeTransform(
      { width: 50, height: 25 },
      { width: 200, height: 100 },
      { x: 100, y: 50 },
      150,
      1,
    );

    expect(result.contentWidthPx).toBeCloseTo(50 * CSS_PX_PER_MM);
    expect(result.contentHeightPx).toBeCloseTo(25 * CSS_PX_PER_MM);
  });

  it("centers the lens on the cursor's corresponding point in the true-size content", () => {
    const viewBox = { width: 40, height: 40 };
    const lensSizePx = 120;

    // Cursor at the container's exact center maps to the content's center too.
    const result = computeLoupeTransform(
      viewBox,
      { width: 200, height: 200 },
      { x: 100, y: 100 },
      lensSizePx,
      1,
    );
    const contentWidthPx = 40 * CSS_PX_PER_MM;

    expect(result.offsetXPx).toBeCloseTo(lensSizePx / 2 - contentWidthPx / 2);
    expect(result.offsetYPx).toBeCloseTo(lensSizePx / 2 - contentWidthPx / 2);
  });

  it("shifts the content by exactly half the lens size when the cursor sits at the container's origin", () => {
    const result = computeLoupeTransform(
      { width: 40, height: 40 },
      { width: 200, height: 200 },
      { x: 0, y: 0 },
      120,
      1,
    );

    expect(result.offsetXPx).toBeCloseTo(60);
    expect(result.offsetYPx).toBeCloseTo(60);
  });

  it("scales the content beyond true physical size in proportion to zoomFactor", () => {
    const result = computeLoupeTransform(
      { width: 50, height: 25 },
      { width: 200, height: 100 },
      { x: 100, y: 50 },
      150,
      3,
    );

    expect(result.contentWidthPx).toBeCloseTo(50 * CSS_PX_PER_MM * 3);
    expect(result.contentHeightPx).toBeCloseTo(25 * CSS_PX_PER_MM * 3);
  });

  it("still centers the lens on the cursor's corresponding point once zoomed", () => {
    const result = computeLoupeTransform(
      { width: 40, height: 40 },
      { width: 200, height: 200 },
      { x: 100, y: 100 },
      120,
      2,
    );
    const contentWidthPx = 40 * CSS_PX_PER_MM * 2;

    expect(result.offsetXPx).toBeCloseTo(60 - contentWidthPx / 2);
    expect(result.offsetYPx).toBeCloseTo(60 - contentWidthPx / 2);
  });
});
