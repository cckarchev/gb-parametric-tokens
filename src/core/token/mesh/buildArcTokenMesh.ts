import { ArcShapeSpec } from "../geometry/nobPlacement";
import { filletOutline } from "../geometry/filletOutline";
import { StyleSpec, Vec2 } from "../types";
import { applyReliefToBase } from "./applyReliefToBase";
import { buildArcRibbonOutline2D } from "./buildArcRibbon";
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

  const ribbon = buildArcRibbonOutline2D(CrossSection, input.shape, input.centerAngleDeg);
  const nobRadiusMm = input.shape.nobDiameterMm / 2;

  const leftNob = CrossSection.circle(nobRadiusMm, NOB_CIRCULAR_SEGMENTS).translate(
    input.nobPositions.left[0],
    input.nobPositions.left[1],
  );

  const rightNob = CrossSection.circle(nobRadiusMm, NOB_CIRCULAR_SEGMENTS).translate(
    input.nobPositions.right[0],
    input.nobPositions.right[1],
  );

  // Filleting has to happen in 2D, before extrusion (filletOutline.ts's offset math has no 3D
  // equivalent), which is why the ribbon and nobs are unioned as flat CrossSections here instead
  // of each being extruded and unioned as solids the way this used to work.
  const withNobs = ribbon.add(leftNob).add(rightNob);
  const outline2D =
    input.shape.nobFilletEnabled && input.shape.nobFilletRadiusMm
      ? filletOutline(withNobs, input.shape.nobFilletRadiusMm)
      : withNobs;

  // IconOverflowBehavior "grow" (see types.ts): a nob icon that overflowed its plain circle
  // carries its own dilated footprint here (computeReliefComponentsShared.ts), already in the
  // same absolute mm space as the nob positions above, so unioning it in makes the nob's own
  // body hug the icon instead of leaving it a plain circle. Added after the fillet, not before,
  // so the fillet radius only ever smooths the nob/ribbon junction it was tuned for.
  const growContours = input.reliefComponents.flatMap((component) => component.growOutline ?? []);
  const outlineWithGrow =
    growContours.length > 0
      ? outline2D.add(new CrossSection(growContours, "Positive"))
      : outline2D;

  const base = outlineWithGrow.extrude(input.style.baseThicknessMm);

  return applyReliefToBase(base, input.style, input.reliefComponents, CrossSection);
};
