import type { Manifold } from "manifold-3d";

import { TokenSpec } from "../types";
import { BASE_COLOR_GROUP_ID } from "./colorGroups";
import { groupReliefComponentsByColorGroup } from "./groupReliefComponents";
import { getManifoldModule } from "./manifoldModule";
import { ReliefComponent } from "./reliefComponent";
import { TokenPart } from "./tokenPart";

const DISC_CIRCULAR_SEGMENTS = 128;
const RELIEF_OVERLAP_MM = 0.05; // sinks the relief slightly into the base to avoid a coplanar boolean op

export type BuildTokenMeshInput = {
  spec: TokenSpec;
  reliefComponents: ReliefComponent[];
};

export const buildTokenMesh = async (input: BuildTokenMeshInput): Promise<TokenPart[]> => {
  if (input.spec.shape.type !== "disc") {
    throw new Error(
      `buildTokenMesh only supports shape: "disc" in M1, got "${input.spec.shape.type}"`,
    );
  }

  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const baseThicknessMm = input.spec.style.baseThicknessMm;
  const reliefHeightMm = input.spec.style.reliefHeightMm;

  const base = CrossSection.circle(input.spec.shape.diameterMm / 2, DISC_CIRCULAR_SEGMENTS).extrude(
    baseThicknessMm,
  );

  if (input.spec.style.relief === "engraved") {
    // A cut is not a volume, so there is nothing to keep separate: every relief contour
    // subtracts from the base regardless of its colorGroup (see M4 plan's Scoping decisions).
    const allContours = input.reliefComponents.flatMap((component) => component.contours);
    const cutHeight = reliefHeightMm + RELIEF_OVERLAP_MM * 2;
    const cutTool = new CrossSection(allContours, "Positive")
      .extrude(cutHeight)
      .translate(0, 0, baseThicknessMm - reliefHeightMm - RELIEF_OVERLAP_MM);

    return [{ colorGroupId: BASE_COLOR_GROUP_ID, manifold: base.subtract(cutTool) }];
  }

  const grouped = groupReliefComponentsByColorGroup(input.reliefComponents);
  const extraParts: TokenPart[] = [];
  let baseManifold: Manifold = base;

  for (const [colorGroupId, contours] of grouped) {
    const relief = new CrossSection(contours, "Positive")
      .extrude(reliefHeightMm)
      .translate(0, 0, baseThicknessMm - RELIEF_OVERLAP_MM);

    if (colorGroupId === BASE_COLOR_GROUP_ID) {
      baseManifold = baseManifold.add(relief);
    } else {
      extraParts.push({ colorGroupId, manifold: relief });
    }
  }

  return [{ colorGroupId: BASE_COLOR_GROUP_ID, manifold: baseManifold }, ...extraParts];
};
