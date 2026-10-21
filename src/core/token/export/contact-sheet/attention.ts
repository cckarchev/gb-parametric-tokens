import { escapeXmlAttribute } from "../three-mf/xml";

const STROKE_COLOR = "#ff6b6b";
const STROKE_WIDTH_MM = 0.6;
const DASH_PATTERN_MM = "2 1";

// Frames a token that needs attention, on screen only. Its <title> is the hover tooltip.
export const buildAttentionMarkerSvg = (
  x: number,
  y: number,
  widthMm: number,
  heightMm: number,
  message: string,
): string =>
  [
    '<g data-role="attention-marker">',
    `<title>${escapeXmlAttribute(message)}</title>`,
    `<rect x="${x}" y="${y}" width="${widthMm}" height="${heightMm}" fill="none" stroke="${STROKE_COLOR}" stroke-width="${STROKE_WIDTH_MM}" stroke-dasharray="${DASH_PATTERN_MM}" />`,
    "</g>",
  ].join("");
