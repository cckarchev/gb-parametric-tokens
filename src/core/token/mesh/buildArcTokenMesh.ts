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

  // IconOverflowBehavior "grow" (see types.ts): a nob icon that overflowed its plain circle
  // carries its own dilated footprint here (computeReliefComponentsShared.ts), already in the
  // same absolute mm space as the nob positions above, so unioning it in makes the nob's own
  // body hug the icon instead of leaving it a plain circle.
  const growContours = input.reliefComponents.flatMap((component) => component.growOutline ?? []);
  const withNobs = ribbon.add(leftNob).add(rightNob);
  const base =
    growContours.length > 0
      ? withNobs.add(
          new CrossSection(growContours, "Positive").extrude(input.style.baseThicknessMm),
        )
      : withNobs;

  return applyReliefToBase(base, input.style, input.reliefComponents, CrossSection);
};
