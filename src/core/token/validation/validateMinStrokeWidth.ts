import type { CrossSection } from "manifold-3d";

import { getManifoldModule } from "../mesh/manifoldModule";
import { Vec2 } from "../types";

const EROSION_CIRCULAR_SEGMENTS = 32;

export type MinStrokeWidthValidation = {
  valid: boolean;
  areaBeforeMm2: number;
  areaAfterErosionMm2: number;
  featureCount: number;
  vanishedFeatureCount: number;
};

export const validateMinStrokeWidth = async (
  reliefContours: Vec2[][],
  minStrokeWidthMm: number,
): Promise<MinStrokeWidthValidation> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const erosionRadiusMm = -minStrokeWidthMm / 2;
  const erode = (section: CrossSection): CrossSection => {
    return section.offset(erosionRadiusMm, "Round", 2, EROSION_CIRCULAR_SEGMENTS);
  };

  const relief = new CrossSection(reliefContours, "Positive");
  const eroded = erode(relief);

  // Asking only whether the eroded union is non-empty is useless on a composed token: the
  // icons are far thicker than minStrokeWidthMm, always survive, and mask any hairline glyph
  // that disappeared. Counting pieces before against after does not work either, because
  // erosion routinely SPLITS a glyph into several pieces, so the total can rise while a
  // separate feature is lost. Eroding each connected feature on its own is what actually
  // answers the question "did any feature vanish".
  // CrossSection#decompose() returns one empty section for an empty input rather than an
  // empty list, hence the isEmpty guard before decomposing.
  const features = relief.isEmpty() ? [] : relief.decompose().filter((one) => !one.isEmpty());
  const vanishedFeatureCount = features.filter((feature) => erode(feature).isEmpty()).length;

  return {
    valid: vanishedFeatureCount === 0,
    areaBeforeMm2: relief.area(),
    areaAfterErosionMm2: eroded.area(),
    featureCount: features.length,
    vanishedFeatureCount,
  };
};
