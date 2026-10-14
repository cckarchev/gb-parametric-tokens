import { ShapeSpec } from "../types";
import { computeEffectiveStudDiameterMm, computeOuterRadiusMm } from "./studPlacement";

// The box a token takes up on the print plate.
export const computeFootprintMm = (shape: ShapeSpec): { width: number; height: number } => {
  if (shape.type === "disc") {
    return { width: shape.diameterMm, height: shape.diameterMm };
  }

  // A conservative square bounding box (not a tight fit) is enough to guarantee no overlap
  // on the plate; the exact silhouette isn't needed here.
  const spanMm = (computeOuterRadiusMm(shape) + computeEffectiveStudDiameterMm(shape) / 2) * 2;

  return { width: spanMm, height: spanMm };
};
