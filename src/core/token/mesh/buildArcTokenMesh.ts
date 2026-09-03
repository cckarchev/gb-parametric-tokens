import type { Manifold } from "manifold-3d";

import { ArcShapeSpec } from "../geometry/nobPlacement";
import { StyleSpec, Vec2 } from "../types";
import { buildArcRibbon } from "./buildArcRibbon";
import { BASE_COLOR_GROUP_ID } from "./colorGroups";
import { groupReliefComponentsByColorGroup } from "./groupReliefComponents";
import { getManifoldModule } from "./manifoldModule";
import { ReliefComponent } from "./reliefComponent";
import { TokenPart } from "./tokenPart";

const NOB_CIRCULAR_SEGMENTS = 48;
const RELIEF_OVERLAP_MM = 0.05; // sinks the relief slightly into the base, same as buildTokenMesh

export type BuildArcTokenMeshInput = {
  shape: ArcShapeSpec;
  centerAngleDeg: number;
  style: StyleSpec;
  nobPositions: { left: Vec2; right: Vec2 };
  reliefComponents: ReliefComponent[];
};

export const buildArcTokenMesh = async (input: BuildArcTokenMeshInput): Promise<TokenPart[]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const ribbon = await buildArcRibbon(
    input.shape,
    input.centerAngleDeg,
    input.style.baseThicknessMm,
  );
  const nobRadiusMm = input.shape.nobDiameterMm / 2;

  const leftNob = CrossSection.circle(nobRadiusMm, NOB_CIRCULAR_SEGMENTS)
    .translate(input.nobPositions.left[0], input.nobPositions.left[1])
    .extrude(input.style.baseThicknessMm);

  const rightNob = CrossSection.circle(nobRadiusMm, NOB_CIRCULAR_SEGMENTS)
    .translate(input.nobPositions.right[0], input.nobPositions.right[1])
    .extrude(input.style.baseThicknessMm);

  const base = ribbon.add(leftNob).add(rightNob);
  const reliefHeightMm = input.style.reliefHeightMm;

  if (input.style.relief === "engraved") {
    const allContours = input.reliefComponents.flatMap((component) => component.contours);
    const cutHeight = reliefHeightMm + RELIEF_OVERLAP_MM * 2;
    const cutTool = new CrossSection(allContours, "Positive")
      .extrude(cutHeight)
      .translate(0, 0, input.style.baseThicknessMm - reliefHeightMm - RELIEF_OVERLAP_MM);

    return [{ colorGroupId: BASE_COLOR_GROUP_ID, manifold: base.subtract(cutTool) }];
  }

  const grouped = groupReliefComponentsByColorGroup(input.reliefComponents);
  const extraParts: TokenPart[] = [];
  let baseManifold: Manifold = base;

  for (const [colorGroupId, contours] of grouped) {
    const relief = new CrossSection(contours, "Positive")
      .extrude(reliefHeightMm)
      .translate(0, 0, input.style.baseThicknessMm - RELIEF_OVERLAP_MM);

    if (colorGroupId === BASE_COLOR_GROUP_ID) {
      baseManifold = baseManifold.add(relief);
    } else {
      extraParts.push({ colorGroupId, manifold: relief });
    }
  }

  return [{ colorGroupId: BASE_COLOR_GROUP_ID, manifold: baseManifold }, ...extraParts];
};
