import type { Font } from "opentype.js";

export type LineAdvances = {
  advancesMm: number[];
  kerningsMm: number[];
};

export const measureAdvances = (font: Font, text: string, sizeMm: number): LineAdvances => {
  const scaleFactor = sizeMm / font.unitsPerEm;
  const glyphs = [...text].map((character) => font.charToGlyph(character));

  const advancesMm = glyphs.map((glyph) => (glyph.advanceWidth ?? 0) * scaleFactor);
  const kerningsMm = glyphs
    .slice(1)
    .map((glyph, index) => font.getKerningValue(glyphs[index], glyph) * scaleFactor);

  return { advancesMm, kerningsMm };
};
