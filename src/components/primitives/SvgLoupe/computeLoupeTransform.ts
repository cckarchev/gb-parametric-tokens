const CSS_DPI = 96;
const MM_PER_INCH = 25.4;

// The browser's standard "CSS pixel" convention (1in = 96px). It's the only way a web page
// can express "true physical size" at all, since it has no access to the display's real DPI.
export const CSS_PX_PER_MM = CSS_DPI / MM_PER_INCH;

export type SizePx = { width: number; height: number };
export type PointPx = { x: number; y: number };
export type ViewBoxSize = { width: number; height: number };

export type LoupeTransform = {
  contentWidthPx: number;
  contentHeightPx: number;
  offsetXPx: number;
  offsetYPx: number;
};

// The lens shows a second copy of the same SVG, scaled so 1mm of token = CSS_PX_PER_MM
// screen pixels (true size) times zoomFactor, translated so the point under the cursor
// lands at the lens center. The on-screen preview may be shrunk to fit its container, so
// the cursor's fractional position within the displayed container is what maps to a point
// in the scaled copy, not the cursor's raw pixel offset.
export const computeLoupeTransform = (
  viewBox: ViewBoxSize,
  containerSizePx: SizePx,
  cursorPx: PointPx,
  lensSizePx: number,
  zoomFactor: number,
): LoupeTransform => {
  const contentWidthPx = viewBox.width * CSS_PX_PER_MM * zoomFactor;
  const contentHeightPx = viewBox.height * CSS_PX_PER_MM * zoomFactor;

  const cursorFractionX = cursorPx.x / containerSizePx.width;
  const cursorFractionY = cursorPx.y / containerSizePx.height;

  const cursorContentPxX = cursorFractionX * contentWidthPx;
  const cursorContentPxY = cursorFractionY * contentHeightPx;

  const offsetXPx = lensSizePx / 2 - cursorContentPxX;
  const offsetYPx = lensSizePx / 2 - cursorContentPxY;

  return { contentWidthPx, contentHeightPx, offsetXPx, offsetYPx };
};
