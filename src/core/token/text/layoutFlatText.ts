import type { Font } from "opentype.js";

import { computeBounds } from "../geometry/computeBounds";
import { translateContours } from "../geometry/contourTransforms";
import type { Vec2 } from "../types";
import { flipGlyphContoursToMathAxes, getGlyphContours } from "./glyphOutline";
import {
  computePenPositions,
  DEFAULT_TRACKING_MM,
  measureAdvances,
} from "./measureAdvances";

type FlatLineSpec = { text: string; sizeMm: number; trackingMm?: number };

export const layoutFlatText = (
  font: Font,
  line: FlatLineSpec,
  toleranceMm: number,
): Vec2[][] => {
  const glyphs = [...line.text].map((character) => font.charToGlyph(character));
  const { advancesMm, kerningsMm } = measureAdvances(
    font,
    line.text,
    line.sizeMm,
  );
  const trackingMm = line.trackingMm ?? DEFAULT_TRACKING_MM;
  const trackedKerningsMm = kerningsMm.map(
    (kerningMm) => kerningMm + trackingMm,
  );

  const penPositionsMm = computePenPositions(advancesMm, trackedKerningsMm);

  const glyphContours = glyphs.flatMap((glyph, index) => {
    const nativeContours = getGlyphContours(glyph, line.sizeMm, toleranceMm);
    const localContours = flipGlyphContoursToMathAxes(nativeContours);

    return translateContours(localContours, [penPositionsMm[index], 0]);
  });

  if (glyphContours.length === 0) {
    return [];
  }

  const bounds = computeBounds(glyphContours);
  const center: Vec2 = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
  ];

  return translateContours(glyphContours, [-center[0], -center[1]]);
};
