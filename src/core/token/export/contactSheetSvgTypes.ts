import { ReliefComponent } from "../mesh/reliefComponent";
import { ShapeSpec, Vec2 } from "../types";

export type ContactSheetItem = {
  shape: ShapeSpec;
  baseContours: Vec2[][];
  reliefComponents: ReliefComponent[];
  copies: number;
};

export type FlippedContactSheetItem = {
  shape: ShapeSpec;
  baseContours: Vec2[][];
  reliefContoursByColorGroup: Map<string, Vec2[][]>;
};

export type SectionLayout = { cellsXml: string; widthMm: number; heightMm: number };

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
export type PreparedSection = {
  flippedItems: FlippedContactSheetItem[];
  boundsByItem: { min: Vec2; max: Vec2 }[];
  cellWidthMm: number;
  cellHeightMm: number;
  cellPaddingMm: number;
  arcLeftMarginMm: number;
  arcTopMarginMm: number;
  alignToGridVertex: boolean;
};
