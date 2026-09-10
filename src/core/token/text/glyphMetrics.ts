// Empirically measured against the bundled font (Saira Condensed Bold) rendering arc text, via
// the real pipeline (layoutArcText itself): how far a typical capital letter's top edge sits
// above its baseline radius, as a fraction of sizeMm. Deliberately not the font's own
// `ascender` metric, which reserves headroom for accents this text never uses and would
// overestimate the true ink, throwing off the margin balance at the call sites. Remeasure (see
// computeArcReliefComponents.ts's git history for the throwaway `_measure-saira.test.ts`
// approach) if the default font ever changes again.
const GLYPH_ASCENT_RATIO = 0.69;

// How tall a line of this app's all-caps text actually stands above its baseline. Shared by the
// ribbon arc's two-line centering (computeArcReliefComponents.ts) and the ring layout's
// outward/inward radius balancing (catalog/tokenItems/goalInfluenceTokenSpec.ts), since both are
// the same "how much ink is there above the baseline" question.
export const estimateAscentMm = (sizeMm: number): number => {
  return sizeMm * GLYPH_ASCENT_RATIO;
};
