import {
  buildGridOverlaySvg,
  type RenderedSvg,
  type SvgBounds,
} from "../../preview/svgGrid";
import type { ColorGroupSpec } from "../../types";
import { flipItem } from "./flip";
import { roundUpToGridStep } from "./geometry";
import { layoutPreparedSection } from "./layout";
import { groupDiscItemsByDiameter, prepareSection } from "./prepare";
import type {
  ContactSheetItem,
  FlippedContactSheetItem,
  PreparedSection,
  SectionLayout,
} from "./types";

// Arc cells get no padding: prepareSection rounds padding plus margin up to the
// next grid line anyway, so any padding would grow each gap by a whole grid
// step.
const CELL_PADDING_MM = 0;
// With the circle hidden an arc cell isn't rounded up vertically, so this
// padding alone keeps rows apart: twice this between two rows of arc tokens.
const TIGHT_ARC_CELL_PADDING_MM = 2;
// Disc cells round up to the grid too, so a token's diameter can be read off
// the grid.
const DISC_CELL_PADDING_MM = 2;
// Caps the width every section wraps at, so a large `columns` can't stretch a
// row off the sheet.
const MAX_SHEET_WIDTH_MM = 240;

export type ContactSheetOptions = {
  // The 30mm base circle behind each arc token. Hidden, the arc cells shrink to
  // the tokens themselves, so the sheet packs them much closer together.
  showBaseReference: boolean;
};

const DEFAULT_CONTACT_SHEET_OPTIONS: ContactSheetOptions = {
  showBaseReference: true,
};

const EMPTY_SHEET: RenderedSvg = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 0"></svg>',
  viewBox: { x: 0, y: 0, width: 0, height: 0 },
};

// One cell per printed copy, so the sheet shows exactly what gets printed. Each
// item is flipped once and repeated.
const printedCopies = (items: ContactSheetItem[]): FlippedContactSheetItem[] =>
  items.flatMap((item) => {
    const flipped = flipItem(item);

    return new Array<FlippedContactSheetItem>(item.copies).fill(flipped);
  });

// The disc groups stacked one under the other from startMmY down.
const layoutDiscGroups = (
  preparedGroups: PreparedSection[],
  startMmY: number,
  columnsFor: (cellWidthMm: number) => number,
  colorGroups: ColorGroupSpec[],
  showBaseReference: boolean,
): SectionLayout[] => {
  let nextOriginMmY = startMmY;

  return preparedGroups.map((prepared) => {
    const layout = layoutPreparedSection(
      prepared,
      columnsFor(prepared.cellWidthMm),
      nextOriginMmY,
      colorGroups,
      showBaseReference,
    );

    nextOriginMmY += layout.heightMm;

    return layout;
  });
};

// The arc section on top and the disc groups below it, under one grid overlay.
const assembleSheet = (
  arcSection: SectionLayout | undefined,
  discGroupLayouts: SectionLayout[],
  discSectionStartMmY: number,
): RenderedSvg => {
  const discSectionWidthMm = Math.max(
    0,
    ...discGroupLayouts.map((layout) => layout.widthMm),
  );
  const discSectionHeightMm = discGroupLayouts.reduce(
    (sum, layout) => sum + layout.heightMm,
    0,
  );

  const totalWidthMm = Math.max(arcSection?.widthMm ?? 0, discSectionWidthMm);
  const totalHeightMm = discSectionStartMmY + discSectionHeightMm;
  const viewBox: SvgBounds = {
    x: 0,
    y: 0,
    width: totalWidthMm,
    height: totalHeightMm,
  };
  const cellsXml = [
    arcSection?.cellsXml,
    ...discGroupLayouts.map((layout) => layout.cellsXml),
  ]
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

export const buildContactSheetSvg = (
  items: ContactSheetItem[],
  columns: number,
  colorGroups: ColorGroupSpec[],
  options: ContactSheetOptions = DEFAULT_CONTACT_SHEET_OPTIONS,
): RenderedSvg => {
  if (items.length === 0) {
    return EMPTY_SHEET;
  }

  const flippedItems = printedCopies(items);
  const arcItems = flippedItems.filter((item) => item.shape.type === "arc");
  const discItems = flippedItems.filter((item) => item.shape.type === "disc");

  const arcCellPaddingMm = options.showBaseReference
    ? CELL_PADDING_MM
    : TIGHT_ARC_CELL_PADDING_MM;
  const arcPrepared =
    arcItems.length > 0
      ? prepareSection(
          arcItems,
          arcCellPaddingMm,
          false,
          options.showBaseReference,
        )
      : undefined;
  const discPreparedGroups = groupDiscItemsByDiameter(discItems).map((group) =>
    prepareSection(group, DISC_CELL_PADDING_MM, true),
  );

  // The widest cell (usually the arc's) sets the sheet's width. Every group
  // then fits as many of its own cells per row as that width allows, so small
  // tokens pack densely and a big group wraps into more rows instead of growing
  // wider than the sheet.
  const referenceCellWidthMm =
    arcPrepared?.cellWidthMm ??
    Math.max(0, ...discPreparedGroups.map((prepared) => prepared.cellWidthMm));
  const targetWidthMm = Math.min(
    columns * referenceCellWidthMm,
    MAX_SHEET_WIDTH_MM,
  );
  const columnsToFillTargetWidth = (cellWidthMm: number): number =>
    cellWidthMm > 0
      ? Math.max(1, Math.floor(targetWidthMm / cellWidthMm))
      : columns;

  const arcSection = arcPrepared
    ? layoutPreparedSection(
        arcPrepared,
        columnsToFillTargetWidth(arcPrepared.cellWidthMm),
        0,
        colorGroups,
        options.showBaseReference,
      )
    : undefined;

  // The disc groups have to start on a grid line for their token centers to
  // land on grid intersections, and the arc section's height rarely ends on
  // one.
  const discSectionStartMmY = roundUpToGridStep(arcSection?.heightMm ?? 0);

  const discGroupLayouts = layoutDiscGroups(
    discPreparedGroups,
    discSectionStartMmY,
    columnsToFillTargetWidth,
    colorGroups,
    options.showBaseReference,
  );

  return assembleSheet(arcSection, discGroupLayouts, discSectionStartMmY);
};
