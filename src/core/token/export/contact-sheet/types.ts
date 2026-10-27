import type { Bounds } from "../../geometry/computeBounds";
import type { ReliefComponent } from "../../mesh/reliefComponent";
import type { ShapeSpec, Vec2 } from "../../types";

export type ContactSheetItem = {
  shape: ShapeSpec;
  baseContours: Vec2[][];
  reliefComponents: ReliefComponent[];
  copies: number;
  // Optional because geometry tests build items without them. A missing `valid`
  // counts as valid.
  label?: string;
  valid?: boolean;
  reason?: string;
};

export type FlippedContactSheetItem = {
  shape: ShapeSpec;
  baseContours: Vec2[][];
  reliefContoursByColorGroup: Map<string, Vec2[][]>;
  label?: string;
  valid?: boolean;
  reason?: string;
};

export type SectionLayout = {
  cellsXml: string;
  widthMm: number;
  heightMm: number;
};

// A section's cell size, worked out before any item is placed so the sheet can
// decide how many columns fit. The arc margins stay 0 for a disc group.
//
// alignToGridVertex rounds the cell to twice the grid step and centers each
// item in it, which puts every item's center on a grid intersection.
export type PreparedSection = {
  flippedItems: FlippedContactSheetItem[];
  boundsByItem: Bounds[];
  cellWidthMm: number;
  cellHeightMm: number;
  cellPaddingMm: number;
  arcLeftMarginMm: number;
  arcTopMarginMm: number;
  alignToGridVertex: boolean;
};
