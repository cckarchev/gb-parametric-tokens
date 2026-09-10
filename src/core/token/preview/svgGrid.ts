export const GRID_STEP_MM = 10;
const GRID_STROKE_COLOR = "#808080";
const GRID_STROKE_WIDTH_MM = 0.15;

export type SvgBounds = { x: number; y: number; width: number; height: number };

export type RenderedSvg = { svg: string; viewBox: SvgBounds };

// Positions are built from an integer step count off the origin, not by repeatedly adding
// GRID_STEP_MM, so floating-point drift can't creep in across a wide grid.
const buildAxisPositions = (start: number, end: number): number[] => {
  const firstMark = Math.ceil(start / GRID_STEP_MM) * GRID_STEP_MM;
  const stepCount = Math.floor((end - firstMark) / GRID_STEP_MM);
  const positions: number[] = [];

  for (let i = 0; i <= stepCount; i++) {
    positions.push(firstMark + i * GRID_STEP_MM);
  }

  return positions;
};

// A 1cm x 1cm reference grid, purely a visual guide for judging real-world scale on screen.
// It is drawn as its own overlay group, never fed into any print/export contour, and blended
// with mix-blend-mode so one stroke color stays legible whatever it lands on, light or dark.
export const buildGridOverlaySvg = (bounds: SvgBounds): string => {
  const endX = bounds.x + bounds.width;
  const endY = bounds.y + bounds.height;

  const verticalLines = buildAxisPositions(bounds.x, endX).map(
    (x) => `M${x},${bounds.y} L${x},${endY}`,
  );
  const horizontalLines = buildAxisPositions(bounds.y, endY).map(
    (y) => `M${bounds.x},${y} L${endX},${y}`,
  );

  const pathData = [...verticalLines, ...horizontalLines].join(" ");

  return [
    '<g data-role="grid-overlay" style="mix-blend-mode:difference">',
    `<path d="${pathData}" stroke="${GRID_STROKE_COLOR}" stroke-width="${GRID_STROKE_WIDTH_MM}" fill="none" />`,
    "</g>",
  ].join("");
};
