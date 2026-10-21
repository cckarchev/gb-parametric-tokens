import type { Font } from "opentype.js";

// No extra space between glyphs beyond the font's own advances and kerning. Both text layouts
// start here and only depart from it when a caller (or autoFit.ts's cascade) asks for tracking.
export const DEFAULT_TRACKING_MM = 0;

type LineAdvances = {
  advancesMm: number[];
  kerningsMm: number[];
};

export const measureAdvances = (
  font: Font,
  text: string,
  sizeMm: number,
): LineAdvances => {
  const scaleFactor = sizeMm / font.unitsPerEm;
  const glyphs = [...text].map((character) => font.charToGlyph(character));

  const advancesMm = glyphs.map(
    (glyph) => (glyph.advanceWidth ?? 0) * scaleFactor,
  );
  const kerningsMm = glyphs
    .slice(1)
    .map(
      (glyph, index) =>
        font.getKerningValue(glyphs[index], glyph) * scaleFactor,
    );

  return { advancesMm, kerningsMm };
};

// Where each glyph's pen starts along the baseline: the running sum of advances and kernings.
// Callers fold tracking into kerningsMm.
export const computePenPositions = (
  advancesMm: number[],
  kerningsMm: number[],
): number[] => {
  const penPositionsMm: number[] = [0];

  for (let index = 1; index < advancesMm.length; index++) {
    const previousPen = penPositionsMm[index - 1];
    const previousAdvance = advancesMm[index - 1];
    const kerning = kerningsMm[index - 1];

    penPositionsMm.push(previousPen + previousAdvance + kerning);
  }

  return penPositionsMm;
};
