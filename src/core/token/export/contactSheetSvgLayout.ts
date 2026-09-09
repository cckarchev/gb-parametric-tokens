import { BASE_COLOR_GROUP_ID, resolveColorGroupDisplay } from "../mesh/colorGroups";
import {
  buildBaseReferenceCircleSvg,
  CIRCLE_ANCHOR_X_SVG,
  CIRCLE_ANCHOR_Y_SVG,
} from "../preview/svgBaseReference";
import { ColorGroupSpec } from "../types";
import { buildAttentionMarkerSvg } from "./contactSheetSvgAttention";
import { contourToPathSegment, offsetContour } from "./contactSheetSvgGeometry";
import { PreparedSection, SectionLayout } from "./contactSheetSvgTypes";

const FALLBACK_ITEM_LABEL = "This token";
// Only reachable if an invalid item somehow carries no reason (never happens via the real
// pipeline, which always sets one alongside `valid: false` -- see tokenWorker.ts); kept so the
// marker still says something useful instead of "undefined".
const FALLBACK_ATTENTION_REASON = "This detail is thinner than the minimum printable stroke width.";

// Renders one homogeneous grid (every item the same shape.type, cell size already decided by
// prepareSection) of cells at the given column count, offset vertically by originYMm so multiple
// sections/groups can stack in the same sheet.
export const layoutPreparedSection = (
  prepared: PreparedSection,
  columns: number,
  originYMm: number,
  colorGroups: ColorGroupSpec[],
): SectionLayout => {
  const {
    flippedItems,
    boundsByItem,
    cellWidthMm,
    cellHeightMm,
    cellPaddingMm,
    arcLeftMarginMm,
    arcTopMarginMm,
    alignToGridVertex,
  } = prepared;

  const baseColor = resolveColorGroupDisplay(BASE_COLOR_GROUP_ID, colorGroups).color;

  const cellsXml = flippedItems
    .map((item, index) => {
      const bounds = boundsByItem[index];
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cellOriginX = column * cellWidthMm;
      const cellOriginY = originYMm + row * cellHeightMm;
      const isArc = item.shape.type === "arc";

      // Arc items: a fixed offset, the same for every arc cell, never derived from this
      // item's own bounds (unaffected by alignToGridVertex, per the LOCKED base-reference
      // circle geometry in svgBaseReference.ts). Disc items: centered within the cell when
      // alignToGridVertex is set, so the item's own center -- not merely its padded corner --
      // sits at the cell's center, which is itself a grid vertex.
      const offsetX = isArc
        ? cellOriginX + cellPaddingMm + arcLeftMarginMm
        : alignToGridVertex
          ? cellOriginX + cellWidthMm / 2 - (bounds.min[0] + bounds.max[0]) / 2
          : cellOriginX + cellPaddingMm - bounds.min[0];
      const offsetY = isArc
        ? cellOriginY + cellPaddingMm + arcTopMarginMm
        : alignToGridVertex
          ? cellOriginY + cellHeightMm / 2 - (bounds.min[1] + bounds.max[1]) / 2
          : cellOriginY + cellPaddingMm - bounds.min[1];

      const contoursOffsetX = isArc ? offsetX + CIRCLE_ANCHOR_X_SVG : offsetX;
      const contoursOffsetY = isArc ? offsetY + CIRCLE_ANCHOR_Y_SVG : offsetY;

      const baseReferenceCircleSvg = isArc
        ? buildBaseReferenceCircleSvg(contoursOffsetX, contoursOffsetY)
        : "";

      const basePathData = item.baseContours
        .map((contour) =>
          contourToPathSegment(offsetContour(contour, contoursOffsetX, contoursOffsetY)),
        )
        .join(" ");
      const paths = [
        baseReferenceCircleSvg,
        `<path d="${basePathData}" fill="${baseColor}" fill-rule="evenodd" />`,
      ];

      for (const [colorGroupId, contours] of item.reliefContoursByColorGroup) {
        const color = resolveColorGroupDisplay(colorGroupId, colorGroups).color;
        const pathData = contours
          .map((contour) =>
            contourToPathSegment(offsetContour(contour, contoursOffsetX, contoursOffsetY)),
          )
          .join(" ");

        paths.push(`<path d="${pathData}" fill="${color}" fill-rule="evenodd" />`);
      }

      if (item.valid === false) {
        const label = item.label ?? FALLBACK_ITEM_LABEL;
        const reason = item.reason || FALLBACK_ATTENTION_REASON;

        // Fit to the item's own rendered content (bounds, shifted by this same offset every
        // path above already draws with), not the whole padded/grid-aligned cell -- the cell is
        // sized to fit the biggest item in the section plus grid-snap rounding, so it's usually
        // noticeably bigger than any one item's own footprint (user feedback: the marker doesn't
        // need to follow the grid, just the token).
        paths.push(
          buildAttentionMarkerSvg(
            bounds.min[0] + offsetX,
            bounds.min[1] + offsetY,
            bounds.max[0] - bounds.min[0],
            bounds.max[1] - bounds.min[1],
            `${label}: ${reason}`,
          ),
        );
      }

      return paths.join("");
    })
    .join("");

  const rowCount = Math.ceil(flippedItems.length / columns);
  const widthMm = Math.min(columns, flippedItems.length) * cellWidthMm;
  const heightMm = rowCount * cellHeightMm;

  return { cellsXml, widthMm, heightMm };
};
