import { CENTER_ANGLE_DEG } from "./geometry/angleConventions";
import { computeStudPlacements } from "./geometry/studPlacement";
import { buildArcTokenMesh } from "./mesh/buildArcTokenMesh";
import { buildTokenMesh } from "./mesh/buildTokenMesh";
import type { ReliefComponent } from "./mesh/reliefComponent";
import type { TokenPart } from "./mesh/tokenPart";
import type { TokenSpec } from "./types";

export const buildTokenParts = (
  spec: TokenSpec,
  reliefComponents: ReliefComponent[],
): Promise<TokenPart[]> => {
  if (spec.shape.type === "disc") {
    return buildTokenMesh({ spec, reliefComponents });
  }

  const studPlacements = computeStudPlacements(spec.shape, CENTER_ANGLE_DEG);

  return buildArcTokenMesh({
    shape: spec.shape,
    centerAngleDeg: CENTER_ANGLE_DEG,
    style: spec.style,
    studPositions: {
      left: studPlacements.left.position,
      right: studPlacements.right.position,
    },
    reliefComponents,
  });
};
