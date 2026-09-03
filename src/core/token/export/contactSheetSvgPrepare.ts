import { computeBounds } from "../geometry/computeBounds";
import { Vec2 } from "../types";
import {
  allContoursOf,
  CIRCLE_FOOTPRINT_BOUNDS,
  computeOverflowMarginMm,
  roundUpToGridVertexStep,
  shiftForArcAnchor,
  unionBounds,
} from "./contactSheetSvgGeometry";
import { FlippedContactSheetItem, PreparedSection } from "./contactSheetSvgTypes";

// A small disc (e.g. a 15mm Beer Token) sharing one cell size with a much larger one (e.g. a
// 20mm Goal Influence) sits in a cell padded out to the larger item's size, wasting space around
// every smaller item. Grouping by diameter -- the only thing that varies a disc's own footprint
// in this app -- lets each size form its own tightly-fitted sub-grid instead, stacked below one
// another (see buildContactSheetSvg). Insertion order is preserved (a Map remembers first-seen
// key order) so groups render in the same order their items were selected in, not sorted by size.
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

export const prepareSection = (
  flippedItems: FlippedContactSheetItem[],
  cellPaddingMm: number,
  alignToGridVertex: boolean,
): PreparedSection => {
  const boundsByItem = flippedItems.map((item) =>
    item.shape.type === "arc"
      ? unionBounds(computeBounds(shiftForArcAnchor(allContoursOf(item))), CIRCLE_FOOTPRINT_BOUNDS)
      : computeBounds(allContoursOf(item)),
  );

  const arcCombinedBounds = flippedItems
    .map((item, index) => (item.shape.type === "arc" ? boundsByItem[index] : undefined))
    .filter((bounds): bounds is { min: Vec2; max: Vec2 } => bounds !== undefined);
  const arcLeftMarginMm = computeOverflowMarginMm(arcCombinedBounds, 0);
  const arcTopMarginMm = computeOverflowMarginMm(arcCombinedBounds, 1);

  const rawCellWidthMm =
    Math.max(...boundsByItem.map((bounds) => bounds.max[0] - bounds.min[0])) +
    cellPaddingMm * 2 +
    arcLeftMarginMm;
  const rawCellHeightMm =
    Math.max(...boundsByItem.map((bounds) => bounds.max[1] - bounds.min[1])) +
    cellPaddingMm * 2 +
    arcTopMarginMm;

  const cellWidthMm = alignToGridVertex ? roundUpToGridVertexStep(rawCellWidthMm) : rawCellWidthMm;
  const cellHeightMm = alignToGridVertex
    ? roundUpToGridVertexStep(rawCellHeightMm)
    : rawCellHeightMm;

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
