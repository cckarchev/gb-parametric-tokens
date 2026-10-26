import { MIN_SPOKE_COUNT } from "@/core/token/catalog/token-items/aoeTemplateSpec";

// The fixed range of every editable number in the advanced settings. Wide
// enough for real experimentation, narrow enough to keep obvious nonsense out;
// combinations that still break a token are caught by the layout checks (see
// core/token/validation/validateLayoutGeometry.ts).
type FieldBounds = { min: number; max: number };

export const RELIEF_HEIGHT_BOUNDS: FieldBounds = { min: 0.2, max: 3 };
export const BASE_THICKNESS_BOUNDS: FieldBounds = { min: 1, max: 10 };
export const RIBBON_WIDTH_BOUNDS: FieldBounds = { min: 3, max: 20 };
export const RIBBON_LENGTH_BOUNDS: FieldBounds = { min: 10, max: 60 };
export const STUD_DIAMETER_BOUNDS: FieldBounds = { min: 6, max: 30 };
export const FILLET_RADIUS_BOUNDS: FieldBounds = { min: 0, max: 10 };
export const TEXT_SIZE_BOUNDS: FieldBounds = { min: 1, max: 10 };
export const MOMENTUM_TEXT_SIZE_BOUNDS: FieldBounds = { min: 1, max: 15 };
export const DISC_DIAMETER_BOUNDS: FieldBounds = { min: 10, max: 60 };
export const INSET_BOUNDS: FieldBounds = { min: 0, max: 5 };
export const RING_WIDTH_BOUNDS: FieldBounds = { min: 0.2, max: 3 };
// Fractions, shown as percentages: 10 % to 150 %.
export const CREST_SCALE_BOUNDS: FieldBounds = { min: 0.1, max: 1.5 };
export const BALANCE_SCALE_BOUNDS: FieldBounds = { min: 0.5, max: 2 };
export const BAND_WIDTH_BOUNDS: FieldBounds = { min: 3, max: 15 };
export const SPOKE_COUNT_BOUNDS: FieldBounds = { min: MIN_SPOKE_COUNT, max: 8 };
export const SPOKE_WIDTH_BOUNDS: FieldBounds = { min: 2, max: 15 };
export const ARC_SWEEP_BOUNDS: FieldBounds = { min: 5, max: 120 };
export const CORNER_RADIUS_BOUNDS: FieldBounds = { min: 0, max: 5 };
export const SPOKE_TEXT_CLEARANCE_BOUNDS: FieldBounds = { min: 0, max: 15 };
export const SPOKE_TEXT_MARGIN_BOUNDS: FieldBounds = { min: 0, max: 5 };
