import { escapeXmlAttribute } from "./threeMfXml";

const STROKE_COLOR = "#ff6b6b";
const STROKE_WIDTH_MM = 0.6;
const DASH_PATTERN_MM = "2 1";

// A non-printing overlay, like the grid and the base-reference circle it sits alongside (see
// svgGrid.ts / svgBaseReference.ts): drawn over a cell whose token failed the min-stroke-width
// check, so the sheet itself points at which tokens need attention instead of leaving that to the
// text status line alone. The <title> gives a native browser tooltip on hover.
export const buildAttentionMarkerSvg = (
  x: number,
  y: number,
  widthMm: number,
  heightMm: number,
  message: string,
): string => {
  return [
    '<g data-role="attention-marker">',
    `<title>${escapeXmlAttribute(message)}</title>`,
    `<rect x="${x}" y="${y}" width="${widthMm}" height="${heightMm}" fill="none" stroke="${STROKE_COLOR}" stroke-width="${STROKE_WIDTH_MM}" stroke-dasharray="${DASH_PATTERN_MM}" />`,
    "</g>",
  ].join("");
};
