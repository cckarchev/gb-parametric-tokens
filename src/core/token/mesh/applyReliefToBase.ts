import type { Manifold, ManifoldToplevel } from "manifold-3d";

import { StyleSpec } from "../types";
import { BASE_COLOR_GROUP_ID } from "./colorGroups";
import { groupReliefComponentsByColorGroup } from "./groupReliefComponents";
import { ReliefComponent } from "./reliefComponent";
import { TokenPart } from "./tokenPart";

// Sinks the relief slightly into the base to avoid a coplanar boolean op.
const RELIEF_OVERLAP_MM = 0.05;

// Each non-base color becomes a part that fills a pocket of its own shape, both ending flush with
// the top of the base. Base-colored relief would be invisible on a flat token, so it is dropped.
const inlayReliefIntoBase = (
  base: Manifold,
  style: StyleSpec,
  reliefComponents: ReliefComponent[],
  CrossSection: ManifoldToplevel["CrossSection"],
): TokenPart[] => {
  const inlayDepthMm = style.reliefHeightMm;
  const inlayBottomZ = style.baseThicknessMm - inlayDepthMm;
  // The cut reaches past the top face so it never shares that face with the base.
  const cutHeightMm = inlayDepthMm + RELIEF_OVERLAP_MM;

  const grouped = groupReliefComponentsByColorGroup(reliefComponents);
  const inlayParts: TokenPart[] = [];
  let baseManifold: Manifold = base;

  for (const [colorGroupId, contours] of grouped) {
    if (colorGroupId === BASE_COLOR_GROUP_ID) {
      continue;
    }

    const footprint = new CrossSection(contours, "Positive");
    const cutTool = footprint.extrude(cutHeightMm).translate(0, 0, inlayBottomZ);
    const inlay = footprint.extrude(inlayDepthMm).translate(0, 0, inlayBottomZ);

    baseManifold = baseManifold.subtract(cutTool);
    inlayParts.push({ colorGroupId, manifold: inlay });
  }

  return [{ colorGroupId: BASE_COLOR_GROUP_ID, manifold: baseManifold }, ...inlayParts];
};

export const applyReliefToBase = (
  base: Manifold,
  style: StyleSpec,
  reliefComponents: ReliefComponent[],
  CrossSection: ManifoldToplevel["CrossSection"],
): TokenPart[] => {
  const reliefHeightMm = style.reliefHeightMm;

  if (style.relief === "engraved") {
    // A cut has no volume to color, so every relief contour subtracts whatever its colorGroup.
    const allContours = reliefComponents.flatMap((component) => component.contours);
    const cutHeight = reliefHeightMm + RELIEF_OVERLAP_MM * 2;
    const cutTool = new CrossSection(allContours, "Positive")
      .extrude(cutHeight)
      .translate(0, 0, style.baseThicknessMm - reliefHeightMm - RELIEF_OVERLAP_MM);

    return [{ colorGroupId: BASE_COLOR_GROUP_ID, manifold: base.subtract(cutTool) }];
  }

  if (style.relief === "inlay") {
    return inlayReliefIntoBase(base, style, reliefComponents, CrossSection);
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
