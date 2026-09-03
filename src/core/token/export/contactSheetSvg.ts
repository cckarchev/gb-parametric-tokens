import { BASE_COLOR_GROUP_ID, resolveColorGroupDisplay } from "../mesh/colorGroups";
import { groupReliefComponentsByColorGroup } from "../mesh/groupReliefComponents";
import { ReliefComponent } from "../mesh/reliefComponent";
import {
  buildBaseReferenceCircleSvg,
  CIRCLE_ANCHOR_X_SVG,
  CIRCLE_ANCHOR_Y_SVG,
  MODEL_BASE_DIAMETER_MM,
} from "../preview/svgBaseReference";
import { buildGridOverlaySvg, GRID_STEP_MM, SvgBounds } from "../preview/svgGrid";
import { ColorGroupSpec, ShapeSpec, Vec2 } from "../types";

const CELL_PADDING_MM = 5;
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

type ContactSheetItem = {
  shape: ShapeSpec;
  baseContours: Vec2[][];
  reliefComponents: ReliefComponent[];
  copies: number;
};
export type ContactSheetSvg = { svg: string; viewBox: SvgBounds };
type FlippedContactSheetItem = {
  shape: ShapeSpec;
  baseContours: Vec2[][];
  reliefContoursByColorGroup: Map<string, Vec2[][]>;
};

// Contours arrive in the core pipeline's mathYUp world convention (same as the 3D mesh and
// buildPreviewSvg.ts). SVG's y axis points down, so rendering those coordinates unmodified
// mirrors every item top-to-bottom.
const flipY = (contours: Vec2[][]): Vec2[][] => {
  return contours.map((contour) => contour.map(([x, y]): Vec2 => [x, -y]));
};

const flipItem = (item: ContactSheetItem): FlippedContactSheetItem => {
  const flippedReliefComponents = item.reliefComponents.map((component) => ({
    ...component,
    contours: flipY(component.contours),
  }));

  return {
    shape: item.shape,
    baseContours: flipY(item.baseContours),
    reliefContoursByColorGroup: groupReliefComponentsByColorGroup(flippedReliefComponents),
  };
};

const contourToPathSegment = (contour: Vec2[]): string => {
  const [first, ...rest] = contour;
  const moveTo = `M${first[0]},${first[1]}`;
  const lineTos = rest.map(([x, y]) => `L${x},${y}`).join(" ");

  return `${moveTo} ${lineTos} Z`;
};

const computeBounds = (contours: Vec2[][]): { min: Vec2; max: Vec2 } => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const contour of contours) {
    for (const [x, y] of contour) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { min: [minX, minY], max: [maxX, maxY] };
};

const allContoursOf = (item: FlippedContactSheetItem): Vec2[][] => {
  return [item.baseContours, ...item.reliefContoursByColorGroup.values()].flat();
};

const offsetContour = (contour: Vec2[], offsetX: number, offsetY: number): Vec2[] => {
  return contour.map(([x, y]): Vec2 => [x + offsetX, y + offsetY]);
};

// For an arc item, the token's own local origin -- and therefore the base-reference circle,
// always drawn CIRCLE_ANCHOR_X_SVG/CIRCLE_ANCHOR_Y_SVG away from it -- is fixed relative to
// the item's own contours (see svgBaseReference.ts). Shifting a token's contours by this fixed
// amount places its origin at (CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG) in a local frame
// shared by every arc cell, so changing any shape parameter never moves the circle relative to
// the token: they're the same rigid unit now, unlike the old tangent+snap approach this
// replaces.
const shiftForArcAnchor = (contours: Vec2[][]): Vec2[][] => {
  return contours.map((contour) =>
    offsetContour(contour, CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG),
  );
};

// The circle is always drawn at this fixed local footprint (see shiftForArcAnchor above), no
// matter how small an item's own contours are -- a cell must be big enough for the circle
// itself, not just whatever content happens to be smaller than it.
const CIRCLE_FOOTPRINT_BOUNDS: { min: Vec2; max: Vec2 } = {
  min: [0, 0],
  max: [MODEL_BASE_DIAMETER_MM, MODEL_BASE_DIAMETER_MM],
};

const unionBounds = (
  a: { min: Vec2; max: Vec2 },
  b: { min: Vec2; max: Vec2 },
): { min: Vec2; max: Vec2 } => {
  return {
    min: [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1])],
    max: [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1])],
  };
};

// The fixed anchor above still leaves an arc item free to have real content (e.g. a wide
// sweep's nobs) to the left of, or above, the circle's own local footprint (which always runs
// from local (0, 0) to (MODEL_BASE_DIAMETER_MM, MODEL_BASE_DIAMETER_MM)). Rather than compute a
// per-item margin for that -- the exact pattern that caused the original bug -- one shared
// margin covers the worst case across every arc item in the sheet, the same "Math.max over all
// items" shape cellWidthMm/cellHeightMm already use below. A margin computed this way still
// can't let one item's own parameter change move it relative to its own circle: it can only
// grow the one shared margin every cell reserves, uniformly.
const computeOverflowMarginMm = (arcCombinedBoundsList: { min: Vec2 }[], axis: 0 | 1): number => {
  if (arcCombinedBoundsList.length === 0) {
    return 0;
  }

  return Math.max(0, ...arcCombinedBoundsList.map((bounds) => -bounds.min[axis]));
};

const roundUpToGridStep = (valueMm: number): number => {
  return Math.ceil(valueMm / GRID_STEP_MM) * GRID_STEP_MM;
};

// Twice the grid step: a cell's own center only lands exactly on a grid intersection when both
// the cell's origin (always a multiple of GRID_STEP_MM, see layoutGridSection) and its size are
// multiples of GRID_VERTEX_STEP_MM, since half of a GRID_VERTEX_STEP_MM-sized cell is itself a
// whole multiple of GRID_STEP_MM.
const GRID_VERTEX_STEP_MM = GRID_STEP_MM * 2;

const roundUpToGridVertexStep = (valueMm: number): number => {
  return Math.ceil(valueMm / GRID_VERTEX_STEP_MM) * GRID_VERTEX_STEP_MM;
};

type SectionLayout = { cellsXml: string; widthMm: number; heightMm: number };

// A small disc (e.g. a 15mm Beer Token) sharing one cell size with a much larger one (e.g. a
// 20mm Goal Influence) sits in a cell padded out to the larger item's size, wasting space around
// every smaller item. Grouping by diameter -- the only thing that varies a disc's own footprint
// in this app -- lets each size form its own tightly-fitted sub-grid instead, stacked below one
// another (see buildContactSheetSvg). Insertion order is preserved (a Map remembers first-seen
// key order) so groups render in the same order their items were selected in, not sorted by size.
const groupDiscItemsByDiameter = (
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

// Cell sizing only (no column layout yet): computed once per section/group so
// buildContactSheetSvg can decide how many columns of THIS cell size fit in the sheet's shared
// target width before any item actually gets placed -- see buildContactSheetSvg's
// columnsToFillTargetWidth. Arc-specific logic (the circle footprint, its overflow margin) only
// ever fires for an all-arc section; a disc group skips it entirely.
//
// alignToGridVertex additionally rounds the cell size up to GRID_VERTEX_STEP_MM instead of
// GRID_STEP_MM, and tells layoutPreparedSection below to center each item in its cell rather
// than left/top-align it from the cell's padding -- together these guarantee each item's own
// geometric center lands exactly on a grid intersection, regardless of that item's own size.
type PreparedSection = {
  flippedItems: FlippedContactSheetItem[];
  boundsByItem: { min: Vec2; max: Vec2 }[];
  cellWidthMm: number;
  cellHeightMm: number;
  cellPaddingMm: number;
  arcLeftMarginMm: number;
  arcTopMarginMm: number;
  alignToGridVertex: boolean;
};

const prepareSection = (
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

// Renders one homogeneous grid (every item the same shape.type, cell size already decided by
// prepareSection) of cells at the given column count, offset vertically by originYMm so multiple
// sections/groups can stack in the same sheet.
const layoutPreparedSection = (
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

      return paths.join("");
    })
    .join("");

  const rowCount = Math.ceil(flippedItems.length / columns);
  const widthMm = Math.min(columns, flippedItems.length) * cellWidthMm;
  const heightMm = rowCount * cellHeightMm;

  return { cellsXml, widthMm, heightMm };
};

export const buildContactSheetSvg = (
  items: ContactSheetItem[],
  columns: number,
  colorGroups: ColorGroupSpec[],
): ContactSheetSvg => {
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

  // The sheet's overall width is set once, by whichever section has the widest natural cell --
  // normally the arc section, since an arc token plus its fixed base-reference circle is the
  // biggest thing on the sheet. Every other section/group then wraps at however many of ITS OWN
  // (usually smaller) cells fit inside that same width, instead of every group sharing one fixed
  // column count -- which stranded small items in a narrow column with empty width to their
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
  // of GRID_STEP_MM. No extra gap is added beyond that rounding -- an explicit gap on top of
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
