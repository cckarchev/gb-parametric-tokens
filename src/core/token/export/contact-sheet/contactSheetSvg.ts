import { buildGridOverlaySvg, RenderedSvg, SvgBounds } from "../../preview/svgGrid";
import { ColorGroupSpec } from "../../types";
import { flipItem } from "./flip";
import { roundUpToGridStep } from "./geometry";
import { layoutPreparedSection } from "./layout";
import { groupDiscItemsByDiameter, prepareSection } from "./prepare";
import { ContactSheetItem, FlippedContactSheetItem } from "./types";

// No padding at all around an arc cell's content (it used to be 5mm). prepareSection rounds
// cellPaddingMm plus the arc margin up to the next GRID_STEP_MM line, so any padding that isn't
// already a whole multiple of the grid step gets rounded up to one anyway: 5mm bought a full
// extra 10mm of gap rather than 5. Zero lets arc cells sit as tight as the grid allows (user
// feedback: cells read as "too separated" once alignment made the gaps obvious).
const CELL_PADDING_MM = 0;
// Disc items (guild generics, influence/momentum/goal-influence/MP counters) carry no
// base-reference circle overhead and, once split into their own section below the arc items
// (see buildContactSheetSvg), no longer need to share a cell size with anything bigger. They
// pack tighter than arc cells, and their cell size is rounded up to the next 10mm grid line
// (see svgGrid.ts's GRID_STEP_MM) instead of hugging content exactly, so a viewer can read a
// token's real diameter straight off the reference grid.
const DISC_CELL_PADDING_MM = 2;
// A hard ceiling on how wide the sheet's shared reference width (see buildContactSheetSvg's
// columnsToFillTargetWidth) is allowed to grow: without it, a large `columns` value combined
// with a wide reference cell (the arc section, usually) could flow a group arbitrarily far to
// the right instead of ever wrapping down (user feedback).
const MAX_SHEET_WIDTH_MM = 240;

export const buildContactSheetSvg = (
  items: ContactSheetItem[],
  columns: number,
  colorGroups: ColorGroupSpec[],
): RenderedSvg => {
  if (items.length === 0) {
    const emptyViewBox: SvgBounds = { x: 0, y: 0, width: 0, height: 0 };

    return {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 0"></svg>',
      viewBox: emptyViewBox,
    };
  }

  // One cell per physical copy, not one cell per distinct design: the sheet is meant to show
  // exactly what gets printed, so an item with copies: N is flipped once (its own geometry never
  // changes between copies) and that same flipped result is repeated N times in the cell grid.
  const flippedItems = items.flatMap((item) => {
    const flipped = flipItem(item);

    return new Array<FlippedContactSheetItem>(item.copies).fill(flipped);
  });
  const arcItems = flippedItems.filter((item) => item.shape.type === "arc");
  const discItems = flippedItems.filter((item) => item.shape.type === "disc");

  const arcPrepared =
    arcItems.length > 0 ? prepareSection(arcItems, CELL_PADDING_MM, false) : undefined;
  const discPreparedGroups = groupDiscItemsByDiameter(discItems).map((group) =>
    prepareSection(group, DISC_CELL_PADDING_MM, true),
  );

  // The sheet's overall width is set once, by whichever section has the widest natural cell:
  // normally the arc section, since an arc token plus its fixed base-reference circle is the
  // biggest thing on the sheet. Every other section/group then wraps at however many of ITS OWN
  // (usually smaller) cells fit inside that same width, instead of every group sharing one fixed
  // column count, which stranded small items in a narrow column with empty width to their
  // right, and let a fast-growing group (e.g. more Goal Influence tokens) just get wider than
  // the rest of the sheet instead of wrapping into more rows (user feedback).
  const referenceCellWidthMm =
    arcPrepared?.cellWidthMm ??
    Math.max(0, ...discPreparedGroups.map((prepared) => prepared.cellWidthMm));
  const targetWidthMm = Math.min(columns * referenceCellWidthMm, MAX_SHEET_WIDTH_MM);
  const columnsToFillTargetWidth = (cellWidthMm: number): number =>
    cellWidthMm > 0 ? Math.max(1, Math.floor(targetWidthMm / cellWidthMm)) : columns;

  const arcSection = arcPrepared
    ? layoutPreparedSection(
        arcPrepared,
        columnsToFillTargetWidth(arcPrepared.cellWidthMm),
        0,
        colorGroups,
      )
    : undefined;

  // Rounded up to a grid line even though the arc section itself isn't grid-snapped (its own
  // content-driven height rarely lands on one): each disc sub-grid's row centers only land on
  // grid vertices (see prepareSection's alignToGridVertex) if the sub-grid starts at a multiple
  // of GRID_STEP_MM. No extra gap is added beyond that rounding: an explicit gap on top of
  // every section's own padding read as wasted space (user feedback: bring the sections closer).
  const discSectionStartYMm = roundUpToGridStep(arcSection?.heightMm ?? 0);

  let nextDiscGroupOriginYMm = discSectionStartYMm;
  const discGroupLayouts = discPreparedGroups.map((prepared) => {
    const layout = layoutPreparedSection(
      prepared,
      columnsToFillTargetWidth(prepared.cellWidthMm),
      nextDiscGroupOriginYMm,
      colorGroups,
    );

    nextDiscGroupOriginYMm += layout.heightMm;

    return layout;
  });

  const discSectionWidthMm = Math.max(0, ...discGroupLayouts.map((layout) => layout.widthMm));
  const discSectionHeightMm = discGroupLayouts.reduce((sum, layout) => sum + layout.heightMm, 0);

  const totalWidthMm = Math.max(arcSection?.widthMm ?? 0, discSectionWidthMm);
  const totalHeightMm = discSectionStartYMm + discSectionHeightMm;
  const viewBox: SvgBounds = { x: 0, y: 0, width: totalWidthMm, height: totalHeightMm };
  const cellsXml = [arcSection?.cellsXml, ...discGroupLayouts.map((layout) => layout.cellsXml)]
    .filter(Boolean)
    .join("");

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidthMm} ${totalHeightMm}">`,
    buildGridOverlaySvg(viewBox),
    cellsXml,
    "</svg>",
  ].join("\n");

  return { svg, viewBox };
};
