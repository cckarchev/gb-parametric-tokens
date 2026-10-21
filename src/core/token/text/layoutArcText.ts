import type { Font } from "opentype.js";

import { CENTER_ANGLE_DEG } from "../geometry/angleConventions";
import type { Vec2 } from "../types";
import {
  type ArcOrientation,
  applyArcPlacement,
  computeArcGlyphPlacements,
} from "./arcPlacement";
import { flipGlyphContoursToYUp, getGlyphContours } from "./glyphOutline";
import { DEFAULT_TRACKING_MM, measureAdvances } from "./measureAdvances";

type ArcLineSpec = {
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
  const { advancesMm, kerningsMm } = measureAdvances(
    font,
    line.text,
    line.sizeMm,
  );
  const trackingMm = line.trackingMm ?? DEFAULT_TRACKING_MM;
  const trackedKerningsMm = kerningsMm.map(
    (kerningMm) => kerningMm + trackingMm,
  );

  const placements = computeArcGlyphPlacements({
    advancesMm,
    kerningsMm: trackedKerningsMm,
    radiusMm: line.radiusMm,
    centerAngleDeg: line.centerAngleDeg ?? CENTER_ANGLE_DEG,
    coordinateConvention,
    orientation: line.orientation,
  });

  return glyphs.flatMap((glyph, index) => {
    const nativeContours = getGlyphContours(glyph, line.sizeMm, toleranceMm);
    // The svgYDown path wants opentype.js' native y-down outlines untouched; applyArcPlacement's
    // mathYUp rotation assumes an already y-up glyph (ascender at positive local y).
    const localContours =
      coordinateConvention === "mathYUp"
        ? flipGlyphContoursToYUp(nativeContours)
        : nativeContours;

    return applyArcPlacement(localContours, placements[index]);
  });
};
