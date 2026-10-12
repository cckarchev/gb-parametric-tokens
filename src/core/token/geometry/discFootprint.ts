import type { CrossSection as CrossSectionInstance, ManifoldToplevel } from "manifold-3d";

import { DiscShapeSpec } from "../types";
import { BODY_CIRCLE_SEGMENTS } from "./circleResolution";

// The disc's flat outline before any extrusion or grow union: a plain circle, or a ring when
// innerDiameterMm is set. Shared by the real mesh (mesh/buildTokenMesh.ts) and the 2D preview
// (preview/computeBaseOutlineContours.ts) so the two can never disagree about the hole.
export const buildDiscFootprint = (
  CrossSection: ManifoldToplevel["CrossSection"],
  shape: DiscShapeSpec,
): CrossSectionInstance => {
  const outerRadiusMm = shape.diameterMm / 2;
  const outer = CrossSection.circle(outerRadiusMm, BODY_CIRCLE_SEGMENTS);

  if (shape.innerDiameterMm === undefined) {
    return outer;
  }

  const innerRadiusMm = shape.innerDiameterMm / 2;
  const hole = CrossSection.circle(innerRadiusMm, BODY_CIRCLE_SEGMENTS);

  return outer.subtract(hole);
};
