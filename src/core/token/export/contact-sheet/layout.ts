import { buildTokenPathsSvg } from "../../buildTokenPathsSvg";
import { translateContours } from "../../geometry/contourTransforms";
import {
  buildBaseReferenceCircleSvg,
  CIRCLE_ANCHOR_X_SVG,
  CIRCLE_ANCHOR_Y_SVG,
} from "../../preview/svgBaseReference";
import { ColorGroupSpec, Vec2 } from "../../types";
import { buildAttentionMarkerSvg } from "./attention";
import { PreparedSection, SectionLayout } from "./types";

const FALLBACK_ITEM_LABEL = "This token";
// For an invalid item with no reason. The worker always sends one, but the type allows it.
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

// Draws one section's grid at the given column count, starting at originYMm so sections stack.
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

      // Shared by both axes so they can't drift apart. An arc token sits at the same fixed
      // offset in every cell, so its circle stays put. A disc token is centered when
      // alignToGridVertex is set, otherwise placed from the padded corner.
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

        // The marker frames the token itself, not its cell, which is sized for the section's
        // biggest token.
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
