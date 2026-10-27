import type { Manifold, ManifoldToplevel } from "manifold-3d";

import type { StyleSpec } from "../types";
import { BASE_COLOR_GROUP_ID } from "./colorGroups";
import { groupReliefComponentsByColorGroup } from "./groupReliefComponents";
import type { ReliefComponent } from "./reliefComponent";
import type { TokenPart } from "./tokenPart";

// Sinks the relief slightly into the base to avoid a coplanar boolean op.
const RELIEF_OVERLAP_MM = 0.05;
// The least base left under an engraving or an inlay pocket, so a relief deeper
// than the base can't cut through it or push an inlay below the bed.
const MIN_FLOOR_MM = 0.4;

const computePocketDepthMm = (style: StyleSpec): number => {
  const deepestPocketMm = Math.max(0, style.baseThicknessMm - MIN_FLOOR_MM);

  return Math.min(style.reliefHeightMm, deepestPocketMm);
};

// Each non-base color becomes a part that fills a pocket of its own shape, both
// ending flush with the top of the base. Base-colored relief would be invisible
// on a flat token, so it is dropped.
const inlayReliefIntoBase = (
  base: Manifold,
  style: StyleSpec,
  reliefComponents: ReliefComponent[],
  CrossSection: ManifoldToplevel["CrossSection"],
): TokenPart[] => {
  const inlayDepthMm = computePocketDepthMm(style);
  const inlayBottomZ = style.baseThicknessMm - inlayDepthMm;
  // The cut reaches past the top face so it never shares that face with the
  // base.
  const cutHeightMm = inlayDepthMm + RELIEF_OVERLAP_MM;

  const grouped = groupReliefComponentsByColorGroup(reliefComponents);
  const inlayParts: TokenPart[] = [];
  let baseManifold: Manifold = base;

  for (const [colorGroupId, contours] of grouped) {
    if (colorGroupId === BASE_COLOR_GROUP_ID) {
      continue;
    }

    const footprint = new CrossSection(contours, "Positive");
    const cutTool = footprint
      .extrude(cutHeightMm)
      .translate(0, 0, inlayBottomZ);
    const inlay = footprint.extrude(inlayDepthMm).translate(0, 0, inlayBottomZ);

    baseManifold = baseManifold.subtract(cutTool);
    inlayParts.push({ colorGroupId, manifold: inlay });
  }

  return [
    { colorGroupId: BASE_COLOR_GROUP_ID, manifold: baseManifold },
    ...inlayParts,
  ];
};

export const applyReliefToBase = (
  base: Manifold,
  style: StyleSpec,
  reliefComponents: ReliefComponent[],
  CrossSection: ManifoldToplevel["CrossSection"],
): TokenPart[] => {
  const reliefHeightMm = style.reliefHeightMm;

  if (style.relief === "engraved") {
    // A cut has no volume to color, so every relief contour subtracts whatever
    // its colorGroup. Like an inlay pocket, the cut reaches past the top face
    // only, so its floor sits exactly engraveDepthMm down.
    const allContours = reliefComponents.flatMap(
      (component) => component.contours,
    );
    const engraveDepthMm = computePocketDepthMm(style);
    const cutHeight = engraveDepthMm + RELIEF_OVERLAP_MM;
    const cutTool = new CrossSection(allContours, "Positive")
      .extrude(cutHeight)
      .translate(0, 0, style.baseThicknessMm - engraveDepthMm);

    return [
      { colorGroupId: BASE_COLOR_GROUP_ID, manifold: base.subtract(cutTool) },
    ];
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

  return [
    { colorGroupId: BASE_COLOR_GROUP_ID, manifold: baseManifold },
    ...extraParts,
  ];
};
