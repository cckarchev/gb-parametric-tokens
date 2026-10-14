import { Bounds, computeBounds } from "../geometry/computeBounds";
import {
  allContoursOf,
  CIRCLE_FOOTPRINT_BOUNDS,
  computeOverflowMarginMm,
  roundUpToGridStep,
  roundUpToGridVertexStep,
  shiftForArcAnchor,
  unionBounds,
} from "./contactSheetSvgGeometry";
import { FlippedContactSheetItem, PreparedSection } from "./contactSheetSvgTypes";

// A small disc (e.g. a 15mm Beer Token) sharing one cell size with a much larger one (e.g. a
// 20mm Goal Influence) sits in a cell padded out to the larger item's size, wasting space around
// every smaller item. Grouping by diameter, the only thing that varies a disc's own footprint
// in this app, lets each size form its own tightly-fitted sub-grid instead, stacked below one
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
    .filter((bounds): bounds is Bounds => bounds !== undefined);
  const rawArcLeftMarginMm = computeOverflowMarginMm(arcCombinedBounds, 0);
  const rawArcTopMarginMm = computeOverflowMarginMm(arcCombinedBounds, 1);

  // Arc cells aren't centered (see the offsetX/offsetY comment in layoutPreparedSection), so
  // their own grid alignment lives entirely in this left/top margin: the base-reference
  // circle's local footprint (0,0)-(MODEL_BASE_DIAMETER_MM,MODEL_BASE_DIAMETER_MM), already a
  // clean 3-grid-square size, only lands on the sheet's actual 10mm grid lines if
  // cellPaddingMm + this margin comes out to an exact multiple of GRID_STEP_MM. Rounding the
  // combined amount up (not the margin alone) guarantees that, even when there's no real
  // content overflow (raw margin 0), since cellPaddingMm on its own usually isn't already a
  // clean multiple of the grid step.
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

  // Disc cells round up to a 20mm grid-VERTEX step (so a centered item's own middle still lands
  // on a vertex); arc cells only need every column/row origin to land on a plain 10mm grid line
  // (the margin above already handles the anchor point itself), so a 10mm step is enough.
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
