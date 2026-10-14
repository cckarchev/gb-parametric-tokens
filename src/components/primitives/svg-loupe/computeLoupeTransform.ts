import { MM_PER_INCH } from "@/core/units";

const CSS_DPI = 96;

// The browser's standard "CSS pixel" convention (1in = 96px). It's the only way a web page
// can express "true physical size" at all, since it has no access to the display's real DPI.
export const CSS_PX_PER_MM = CSS_DPI / MM_PER_INCH;

type SizePx = { width: number; height: number };
export type PointPx = { x: number; y: number };
export type ViewBoxSize = { width: number; height: number };

type LoupeTransform = {
  contentWidthPx: number;
  contentHeightPx: number;
  offsetXPx: number;
  offsetYPx: number;
};

// The lens draws a second copy of the SVG at true size times zoomFactor, with the point under the
// cursor at its center. The cursor is read as a fraction of the container, since the preview
// itself may be shrunk to fit.
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
