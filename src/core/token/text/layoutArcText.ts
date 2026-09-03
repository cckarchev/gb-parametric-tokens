import type { Font } from "opentype.js";

import { CENTER_ANGLE_DEG } from "../geometry/angleConventions";
import { normalizeWinding } from "../svg/normalizeWinding";
import { Vec2 } from "../types";
import { ArcOrientation, applyArcPlacement, computeArcGlyphPlacements } from "./arcPlacement";
import { getGlyphContours } from "./glyphOutline";
import { measureAdvances } from "./measureAdvances";

const DEFAULT_TRACKING_MM = 0;

// getGlyphContours returns outlines in opentype.js' native y-down space, which is exactly
// what the svgYDown path wants. applyArcPlacement's mathYUp rotation assumes an already
// y-up glyph (ascender at positive local y), so that path has to flip first. Winding is
// reversed by a y-flip, so normalizeWinding must run AFTER the flip, never before: the
// same ordering trap placeIcon documents in geometry/iconPlacement.ts.
const flipYAndNormalize = (contours: Vec2[][]): Vec2[][] => {
  const flipped = contours.map((contour) => contour.map(([x, y]): Vec2 => [x, -y]));

  return normalizeWinding(flipped);
};

export type ArcLineSpec = {
  text: string;
  sizeMm: number;
  radiusMm: number;
  centerAngleDeg?: number;
  trackingMm?: number;
  orientation?: ArcOrientation;
};

export const layoutArcText = (
  font: Font,
  line: ArcLineSpec,
  toleranceMm: number,
  coordinateConvention: "svgYDown" | "mathYUp",
): Vec2[][] => {
  const glyphs = [...line.text].map((character) => font.charToGlyph(character));
  const { advancesMm, kerningsMm } = measureAdvances(font, line.text, line.sizeMm);
  const trackingMm = line.trackingMm ?? DEFAULT_TRACKING_MM;
  const trackedKerningsMm = kerningsMm.map((kerningMm) => kerningMm + trackingMm);

  const placements = computeArcGlyphPlacements({
    advancesMm,
    kerningsMm: trackedKerningsMm,
    radiusMm: line.radiusMm,
    centerAngleDeg: line.centerAngleDeg ?? CENTER_ANGLE_DEG,
    coordinateConvention,
    orientation: line.orientation,
  });

  return glyphs.flatMap((glyph, index) => {
    const nativeContours = getGlyphContours(glyph, line.sizeMm, font.unitsPerEm, toleranceMm);
    const localContours =
      coordinateConvention === "mathYUp" ? flipYAndNormalize(nativeContours) : nativeContours;

    return applyArcPlacement(localContours, placements[index]);
  });
};
