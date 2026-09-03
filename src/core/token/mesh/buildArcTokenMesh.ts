import { ArcShapeSpec } from "../geometry/nobPlacement";
import { StyleSpec, Vec2 } from "../types";
import { applyReliefToBase } from "./applyReliefToBase";
import { buildArcRibbon } from "./buildArcRibbon";
import { getManifoldModule } from "./manifoldModule";
import { ReliefComponent } from "./reliefComponent";
import { TokenPart } from "./tokenPart";

const NOB_CIRCULAR_SEGMENTS = 48;

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

  return applyReliefToBase(base, input.style, input.reliefComponents, CrossSection);
};
