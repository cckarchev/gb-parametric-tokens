import { translateContours } from "../geometry/contourTransforms";
import {
  buildBaseReferenceCircleSvg,
  CIRCLE_ANCHOR_X_SVG,
  CIRCLE_ANCHOR_Y_SVG,
} from "../preview/svgBaseReference";
import { ColorGroupSpec, Vec2 } from "../types";
import { buildAttentionMarkerSvg } from "./contactSheetSvgAttention";
import { PreparedSection, SectionLayout } from "./contactSheetSvgTypes";
import { buildTokenPathsSvg } from "./svgDocument";

const FALLBACK_ITEM_LABEL = "This token";
// Only reachable if an invalid item somehow carries no reason (never happens via the real
// pipeline, which always sets one alongside `valid: false`, see tokenWorker.ts); kept so the
// marker still says something useful instead of "undefined".
const FALLBACK_ATTENTION_REASON = "This detail is thinner than the minimum printable stroke width.";

// buildTokenPathsSvg paints contours where they already are, so a cell's own offset has to reach
// the relief groups too, not just the base contours.
const positionContoursByColorGroup = (
  contoursByColorGroup: Map<string, Vec2[][]>,
  offset: Vec2,
): Map<string, Vec2[][]> => {
  const positioned = new Map<string, Vec2[][]>();

  for (const [colorGroupId, contours] of contoursByColorGroup) {
    positioned.set(colorGroupId, translateContours(contours, offset));
  }

  return positioned;
};

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

  const cellsXml = flippedItems
    .map((item, index) => {
      const bounds = boundsByItem[index];
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cellOriginX = column * cellWidthMm;
      const cellOriginY = originYMm + row * cellHeightMm;
      const isArc = item.shape.type === "arc";

      // Written once and applied per axis, so the horizontal and vertical placement can never
      // drift apart.
      //
      // Arc items: a fixed offset, the same for every arc cell, never derived from this
      // item's own bounds (unaffected by alignToGridVertex, per the LOCKED base-reference
      // circle geometry in svgBaseReference.ts). Disc items: centered within the cell when
      // alignToGridVertex is set, so the item's own center, not merely its padded corner,
      // sits at the cell's center, which is itself a grid vertex.
      const axisOffsetMm = (
        axis: 0 | 1,
        cellOriginMm: number,
        cellSizeMm: number,
        arcMarginMm: number,
      ): number => {
        if (isArc) {
          return cellOriginMm + cellPaddingMm + arcMarginMm;
        }

        if (alignToGridVertex) {
          return cellOriginMm + cellSizeMm / 2 - (bounds.min[axis] + bounds.max[axis]) / 2;
        }

        return cellOriginMm + cellPaddingMm - bounds.min[axis];
      };

      const offsetX = axisOffsetMm(0, cellOriginX, cellWidthMm, arcLeftMarginMm);
      const offsetY = axisOffsetMm(1, cellOriginY, cellHeightMm, arcTopMarginMm);

      const contoursOffset: Vec2 = isArc
        ? [offsetX + CIRCLE_ANCHOR_X_SVG, offsetY + CIRCLE_ANCHOR_Y_SVG]
        : [offsetX, offsetY];

      const baseReferenceCircleSvg = isArc
        ? buildBaseReferenceCircleSvg(contoursOffset[0], contoursOffset[1])
        : "";

      const positionedReliefContours = positionContoursByColorGroup(
        item.reliefContoursByColorGroup,
        contoursOffset,
      );

      const paths = [
        baseReferenceCircleSvg,
        ...buildTokenPathsSvg(
          translateContours(item.baseContours, contoursOffset),
          positionedReliefContours,
          colorGroups,
        ),
      ];

      if (item.valid === false) {
        const label = item.label ?? FALLBACK_ITEM_LABEL;
        // `||`, not `??`: an empty reason string is as useless to a reader as a missing one.
        const reason = item.reason || FALLBACK_ATTENTION_REASON;

        // Fit to the item's own rendered content (bounds, shifted by this same offset every
        // path above already draws with), not the whole padded/grid-aligned cell: the cell is
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
