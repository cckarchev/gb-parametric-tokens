import type { Font } from "opentype.js";

import { computeBounds } from "../geometry/computeBounds";
import { translateContours } from "../geometry/iconPlacement";
import { normalizeWinding } from "../svg/normalizeWinding";
import { Vec2 } from "../types";
import { getGlyphContours } from "./glyphOutline";
import { measureAdvances } from "./measureAdvances";

const DEFAULT_TRACKING_MM = 0;

// getGlyphContours returns native opentype.js y-down outlines. Flat disc text lives in the
// same y-up mm space as icons (see computeReliefComponents' buildIconComponent), so this has
// to flip before use. A y-flip reverses winding, so normalizeWinding must run AFTER the flip,
// same ordering trap documented in layoutArcText.ts and geometry/iconPlacement.ts.
const flipYAndNormalize = (contours: Vec2[][]): Vec2[][] => {
  const flipped = contours.map((contour) => contour.map(([x, y]): Vec2 => [x, -y]));

  return normalizeWinding(flipped);
};

export type FlatLineSpec = { text: string; sizeMm: number; trackingMm?: number };

export const layoutFlatText = (font: Font, line: FlatLineSpec, toleranceMm: number): Vec2[][] => {
  const glyphs = [...line.text].map((character) => font.charToGlyph(character));
  const { advancesMm, kerningsMm } = measureAdvances(font, line.text, line.sizeMm);
  const trackingMm = line.trackingMm ?? DEFAULT_TRACKING_MM;

  const penPositionsMm: number[] = [0];

  for (let index = 1; index < advancesMm.length; index++) {
    const previousPen = penPositionsMm[index - 1];
    const previousAdvance = advancesMm[index - 1];
    const kerning = kerningsMm[index - 1] + trackingMm;

    penPositionsMm.push(previousPen + previousAdvance + kerning);
  }

  const glyphContours = glyphs.flatMap((glyph, index) => {
    const nativeContours = getGlyphContours(glyph, line.sizeMm, font.unitsPerEm, toleranceMm);
    const localContours = flipYAndNormalize(nativeContours);

    return translateContours(localContours, [penPositionsMm[index], 0]);
  });

  if (glyphContours.length === 0) {
    return [];
  }

  const bounds = computeBounds(glyphContours);
  const center: Vec2 = [(bounds.min[0] + bounds.max[0]) / 2, (bounds.min[1] + bounds.max[1]) / 2];

  return translateContours(glyphContours, [-center[0], -center[1]]);
};
