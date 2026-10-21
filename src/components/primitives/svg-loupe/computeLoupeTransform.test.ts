import { describe, expect, it } from "vitest";

import { CSS_PX_PER_MM, computeLoupeTransform } from "./computeLoupeTransform";

// A wide token drawn into a container at twice its true size, the cursor at the center.
const WIDE = {
  viewBox: { width: 50, height: 25 },
  container: { width: 200, height: 100 },
  cursor: { x: 100, y: 50 },
  lensSizePx: 150,
};

// A square token drawn into a square container.
const SQUARE = {
  viewBox: { width: 40, height: 40 },
  container: { width: 200, height: 200 },
  center: { x: 100, y: 100 },
  origin: { x: 0, y: 0 },
  lensSizePx: 120,
};

describe("computeLoupeTransform", () => {
  it("scales the content to true 1:1 physical size using the CSS 96dpi convention at zoomFactor 1", () => {
    const result = computeLoupeTransform(
      WIDE.viewBox,
      WIDE.container,
      WIDE.cursor,
      WIDE.lensSizePx,
      1,
    );

    expect(result.contentWidthPx).toBeCloseTo(
      WIDE.viewBox.width * CSS_PX_PER_MM,
    );
    expect(result.contentHeightPx).toBeCloseTo(
      WIDE.viewBox.height * CSS_PX_PER_MM,
    );
  });

  it("centers the lens on the cursor's corresponding point in the true-size content", () => {
    const { viewBox, lensSizePx } = SQUARE;

    // Cursor at the container's exact center maps to the content's center too.
    const result = computeLoupeTransform(
      viewBox,
      SQUARE.container,
      SQUARE.center,
      lensSizePx,
      1,
    );
    const contentWidthPx = viewBox.width * CSS_PX_PER_MM;

    expect(result.offsetXPx).toBeCloseTo(lensSizePx / 2 - contentWidthPx / 2);
    expect(result.offsetYPx).toBeCloseTo(lensSizePx / 2 - contentWidthPx / 2);
  });

  it("shifts the content by exactly half the lens size when the cursor sits at the container's origin", () => {
    const result = computeLoupeTransform(
      SQUARE.viewBox,
      SQUARE.container,
      SQUARE.origin,
      SQUARE.lensSizePx,
      1,
    );

    expect(result.offsetXPx).toBeCloseTo(SQUARE.lensSizePx / 2);
    expect(result.offsetYPx).toBeCloseTo(SQUARE.lensSizePx / 2);
  });
});

describe("computeLoupeTransform when zoomed", () => {
  it("scales the content beyond true physical size in proportion to zoomFactor", () => {
    const zoomFactor = 3;
    const result = computeLoupeTransform(
      WIDE.viewBox,
      WIDE.container,
      WIDE.cursor,
      WIDE.lensSizePx,
      zoomFactor,
    );

    expect(result.contentWidthPx).toBeCloseTo(
      WIDE.viewBox.width * CSS_PX_PER_MM * zoomFactor,
    );
    expect(result.contentHeightPx).toBeCloseTo(
      WIDE.viewBox.height * CSS_PX_PER_MM * zoomFactor,
    );
  });

  it("still centers the lens on the cursor's corresponding point once zoomed", () => {
    const zoomFactor = 2;
    const result = computeLoupeTransform(
      SQUARE.viewBox,
      SQUARE.container,
      SQUARE.center,
      SQUARE.lensSizePx,
      zoomFactor,
    );
    const contentWidthPx = SQUARE.viewBox.width * CSS_PX_PER_MM * zoomFactor;
    const lensCenterPx = SQUARE.lensSizePx / 2;

    expect(result.offsetXPx).toBeCloseTo(lensCenterPx - contentWidthPx / 2);
    expect(result.offsetYPx).toBeCloseTo(lensCenterPx - contentWidthPx / 2);
  });
});
