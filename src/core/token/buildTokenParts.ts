import { CENTER_ANGLE_DEG } from "./geometry/angleConventions";
import { computeNobPlacements } from "./geometry/nobPlacement";
import { buildArcTokenMesh } from "./mesh/buildArcTokenMesh";
import { buildTokenMesh } from "./mesh/buildTokenMesh";
import { ReliefComponent } from "./mesh/reliefComponent";
import { TokenPart } from "./mesh/tokenPart";
import { TokenSpec } from "./types";

export const buildTokenParts = (
  spec: TokenSpec,
  reliefComponents: ReliefComponent[],
): Promise<TokenPart[]> => {
  if (spec.shape.type === "disc") {
    return buildTokenMesh({ spec, reliefComponents });
  }

  const nobPlacements = computeNobPlacements(spec.shape, CENTER_ANGLE_DEG);

  return buildArcTokenMesh({
    shape: spec.shape,
    centerAngleDeg: CENTER_ANGLE_DEG,
    style: spec.style,
    nobPositions: { left: nobPlacements.left.position, right: nobPlacements.right.position },
    reliefComponents,
  });
};
