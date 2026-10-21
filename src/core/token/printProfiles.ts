import type { PrintProfile } from "./types";

export const PRINT_PROFILES: Record<string, PrintProfile> = {
  resin: {
    id: "resin",
    name: "Resin (SLA/DLP)",
    minStrokeWidthMm: 0.1,
    minReliefHeightMm: 0.1,
    minFeatureGapMm: 0.15,
    bezierToleranceMm: 0.02,
    defaultRelief: "engraved",
  },
  "fdm-025": {
    id: "fdm-025",
    name: "FDM 0.25mm",
    // Scaled down from fdm-04's numbers for a 0.25mm nozzle: a finer nozzle prints a
    // narrower single-wall line, thinner layers, and needs a smaller feature gap.
    minStrokeWidthMm: 0.28,
    minReliefHeightMm: 0.24, // two layers of 0.12mm, the fine-nozzle analog of fdm-04's two 0.2mm layers
    minFeatureGapMm: 0.25,
    bezierToleranceMm: 0.08,
    defaultRelief: "raised",
  },
  "fdm-04": {
    id: "fdm-04",
    name: "FDM 0.4mm",
    minStrokeWidthMm: 0.45,
    minReliefHeightMm: 0.4,
    minFeatureGapMm: 0.4,
    bezierToleranceMm: 0.1,
    defaultRelief: "raised",
  },
};

export const DEFAULT_PRINT_PROFILE_ID = "resin";
