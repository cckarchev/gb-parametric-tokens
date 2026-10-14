import { Bounds, computeBounds } from "../../geometry/computeBounds";
import { CIRCLE_ANCHOR_X_SVG } from "../../preview/svgBaseReference";
import {
  allContoursOf,
  CIRCLE_FOOTPRINT_BOUNDS,
  computeOverflowMarginMm,
  roundUpToGridStep,
  roundUpToGridVertexStep,
  shiftForArcAnchor,
  unionBounds,
} from "./geometry";
import { FlippedContactSheetItem, PreparedSection } from "./types";

// One group per disc diameter, so each size gets its own tightly fitted grid instead of every
// disc sitting in a cell sized for the biggest. Groups keep the order their first item was
// selected in.
export const groupDiscItemsByDiameter = (
  discItems: FlippedContactSheetItem[],
): FlippedContactSheetItem[][] => {
  const itemsByDiameterMm = new Map<number, FlippedContactSheetItem[]>();

  for (const item of discItems) {
    const diameterMm = item.shape.type === "disc" ? item.shape.diameterMm : 0;
    const group = itemsByDiameterMm.get(diameterMm) ?? [];

    group.push(item);
    itemsByDiameterMm.set(diameterMm, group);
  }

  return [...itemsByDiameterMm.values()];
};

// Without the base-reference circle an arc cell hugs its tokens vertically. Horizontally the
// tokens' axis (the anchor, where the circle's center was) stays on a vertical grid line: each
// side of it is rounded up to the grid on its own.
const prepareTightArcSection = (
  flippedItems: FlippedContactSheetItem[],
  cellPaddingMm: number,
): PreparedSection => {
  const boundsByItem = flippedItems.map((item) =>
    computeBounds(shiftForArcAnchor(allContoursOf(item))),
  );
  const combinedBounds = boundsByItem.reduce(unionBounds);

  const extentLeftOfAxisMm = Math.max(0, CIRCLE_ANCHOR_X_SVG - combinedBounds.min[0]);
  const extentRightOfAxisMm = Math.max(0, combinedBounds.max[0] - CIRCLE_ANCHOR_X_SVG);
  const spaceLeftOfAxisMm = roundUpToGridStep(cellPaddingMm + extentLeftOfAxisMm);
  const spaceRightOfAxisMm = roundUpToGridStep(extentRightOfAxisMm + cellPaddingMm);

  const contentHeightMm = combinedBounds.max[1] - combinedBounds.min[1];

  // The layout places the axis at padding + margin + anchor, so this margin puts it at
  // spaceLeftOfAxisMm. Negative when the tokens start below the anchor: the top margin pulls them
  // back up so their top sits on the padding.
  const arcLeftMarginMm = spaceLeftOfAxisMm - cellPaddingMm - CIRCLE_ANCHOR_X_SVG;
  const arcTopMarginMm = -combinedBounds.min[1];

  return {
    flippedItems,
    boundsByItem,
    cellWidthMm: spaceLeftOfAxisMm + spaceRightOfAxisMm,
    cellHeightMm: contentHeightMm + cellPaddingMm * 2,
    cellPaddingMm,
    arcLeftMarginMm,
    arcTopMarginMm,
    alignToGridVertex: false,
  };
};

export const prepareSection = (
  flippedItems: FlippedContactSheetItem[],
  cellPaddingMm: number,
  alignToGridVertex: boolean,
  showBaseReference = true,
): PreparedSection => {
  const isArcSection = flippedItems.every((item) => item.shape.type === "arc");

  if (isArcSection && !showBaseReference) {
    return prepareTightArcSection(flippedItems, cellPaddingMm);
  }

  const boundsByItem = flippedItems.map((item) =>
    item.shape.type === "arc"
      ? unionBounds(computeBounds(shiftForArcAnchor(allContoursOf(item))), CIRCLE_FOOTPRINT_BOUNDS)
      : computeBounds(allContoursOf(item)),
  );

  const arcCombinedBounds = flippedItems
    .map((item, index) => (item.shape.type === "arc" ? boundsByItem[index] : undefined))
    .filter((bounds): bounds is Bounds => bounds !== undefined);
  const rawArcLeftMarginMm = computeOverflowMarginMm(arcCombinedBounds, 0);
  const rawArcTopMarginMm = computeOverflowMarginMm(arcCombinedBounds, 1);

  // Arc tokens aren't centered in their cell, so the circle lands on the grid only if padding
  // plus margin is a whole number of grid steps. The sum is rounded up, not the margin alone,
  // because the padding usually isn't a whole step on its own.
  const arcLeftMarginMm = alignToGridVertex
    ? rawArcLeftMarginMm
    : roundUpToGridStep(cellPaddingMm + rawArcLeftMarginMm) - cellPaddingMm;
  const arcTopMarginMm = alignToGridVertex
    ? rawArcTopMarginMm
    : roundUpToGridStep(cellPaddingMm + rawArcTopMarginMm) - cellPaddingMm;

  const rawCellWidthMm =
    Math.max(...boundsByItem.map((bounds) => bounds.max[0] - bounds.min[0])) +
    cellPaddingMm * 2 +
    arcLeftMarginMm;
  const rawCellHeightMm =
    Math.max(...boundsByItem.map((bounds) => bounds.max[1] - bounds.min[1])) +
    cellPaddingMm * 2 +
    arcTopMarginMm;

  // Disc cells round to two grid steps so a centered token's middle lands on an intersection.
  // Arc cells only need to start on a grid line, since the margin above already places the
  // circle.
  const cellWidthMm = alignToGridVertex
    ? roundUpToGridVertexStep(rawCellWidthMm)
    : roundUpToGridStep(rawCellWidthMm);
  const cellHeightMm = alignToGridVertex
    ? roundUpToGridVertexStep(rawCellHeightMm)
    : roundUpToGridStep(rawCellHeightMm);

  return {
    flippedItems,
    boundsByItem,
    cellWidthMm,
    cellHeightMm,
    cellPaddingMm,
    arcLeftMarginMm,
    arcTopMarginMm,
    alignToGridVertex,
  };
};
