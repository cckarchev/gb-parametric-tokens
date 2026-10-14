import { estimateAscentMm } from "../../text/glyphMetrics";

// The two baselines of a crest-centered badge, from how far the ink sits in from the rim. The top
// line reads outward, so its ink grows past its baseline toward the rim; the bottom line reads
// inward, so its ink grows from its baseline toward the center (see
// computeRingReliefComponents.ts). Placing the top one an ascent further in lines both lines' ink
// up at the same distance from the rim.
export const computeRingTextRadii = (
  discDiameterMm: number,
  textInsetMm: number,
  textSizeMm: number,
  fontId: string | undefined,
): { topMm: number; bottomMm: number } => {
  const discRadiusMm = discDiameterMm / 2;
  const bottomMm = discRadiusMm - textInsetMm;
  const topMm = bottomMm - estimateAscentMm(textSizeMm, fontId);

  return { topMm, bottomMm };
};
