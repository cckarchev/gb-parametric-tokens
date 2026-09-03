import type { Manifold, ManifoldToplevel } from "manifold-3d";

import { StyleSpec } from "../types";
import { BASE_COLOR_GROUP_ID } from "./colorGroups";
import { groupReliefComponentsByColorGroup } from "./groupReliefComponents";
import { ReliefComponent } from "./reliefComponent";
import { TokenPart } from "./tokenPart";

// Sinks the relief slightly into the base to avoid a coplanar boolean op.
const RELIEF_OVERLAP_MM = 0.05;

export const applyReliefToBase = (
  base: Manifold,
  style: StyleSpec,
  reliefComponents: ReliefComponent[],
  CrossSection: ManifoldToplevel["CrossSection"],
): TokenPart[] => {
  const reliefHeightMm = style.reliefHeightMm;

  if (style.relief === "engraved") {
    // A cut is not a volume, so there is nothing to keep separate: every relief contour
    // subtracts from the base regardless of its colorGroup (see M4 plan's Scoping decisions).
    const allContours = reliefComponents.flatMap((component) => component.contours);
    const cutHeight = reliefHeightMm + RELIEF_OVERLAP_MM * 2;
    const cutTool = new CrossSection(allContours, "Positive")
      .extrude(cutHeight)
      .translate(0, 0, style.baseThicknessMm - reliefHeightMm - RELIEF_OVERLAP_MM);

    return [{ colorGroupId: BASE_COLOR_GROUP_ID, manifold: base.subtract(cutTool) }];
  }

  const grouped = groupReliefComponentsByColorGroup(reliefComponents);
  const extraParts: TokenPart[] = [];
  let baseManifold: Manifold = base;

  for (const [colorGroupId, contours] of grouped) {
    const relief = new CrossSection(contours, "Positive")
      .extrude(reliefHeightMm)
      .translate(0, 0, style.baseThicknessMm - RELIEF_OVERLAP_MM);

    if (colorGroupId === BASE_COLOR_GROUP_ID) {
      baseManifold = baseManifold.add(relief);
    } else {
      extraParts.push({ colorGroupId, manifold: relief });
    }
  }

  return [{ colorGroupId: BASE_COLOR_GROUP_ID, manifold: baseManifold }, ...extraParts];
};
