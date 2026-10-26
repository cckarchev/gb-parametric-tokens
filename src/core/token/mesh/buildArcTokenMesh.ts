import { STUD_CIRCLE_SEGMENTS } from "../geometry/circleResolution";
import { filletOutline } from "../geometry/filletOutline";
import { computeEffectiveStudDiameterMm } from "../geometry/studPlacement";
import type { ArcShapeSpec, StyleSpec, Vec2 } from "../types";
import { applyReliefToBase } from "./applyReliefToBase";
import { buildArcRibbonOutline2D } from "./buildArcRibbon";
import { getManifoldModule } from "./manifoldModule";
import {
  collectGrowOutlineContours,
  type ReliefComponent,
} from "./reliefComponent";
import type { TokenPart } from "./tokenPart";

type BuildArcTokenMeshInput = {
  shape: ArcShapeSpec;
  centerAngleDeg: number;
  style: StyleSpec;
  studPositions: { left: Vec2; right: Vec2 };
  reliefComponents: ReliefComponent[];
};

export const buildArcTokenMesh = async (
  input: BuildArcTokenMeshInput,
): Promise<TokenPart[]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const ribbon = buildArcRibbonOutline2D(
    CrossSection,
    input.shape,
    input.centerAngleDeg,
  );
  // The effective size, which computeStudPlacements placed the centers for.
  const studRadiusMm = computeEffectiveStudDiameterMm(input.shape) / 2;

  const leftStud = CrossSection.circle(
    studRadiusMm,
    STUD_CIRCLE_SEGMENTS,
  ).translate(input.studPositions.left[0], input.studPositions.left[1]);

  const rightStud = CrossSection.circle(
    studRadiusMm,
    STUD_CIRCLE_SEGMENTS,
  ).translate(input.studPositions.right[0], input.studPositions.right[1]);

  // Ribbon and studs are joined in 2D because filleting only works on a flat
  // outline, before extrusion.
  const withStuds = ribbon.add(leftStud).add(rightStud);
  const outline2D =
    input.shape.studFilletEnabled && input.shape.studFilletRadiusMm
      ? filletOutline(withStuds, input.shape.studFilletRadiusMm)
      : withStuds;

  // Stud icons with behavior "grow" add their footprint. After the fillet,
  // which is tuned for the stud and ribbon corner only.
  const growContours = collectGrowOutlineContours(input.reliefComponents);
  const outlineWithGrow =
    growContours.length > 0
      ? outline2D.add(new CrossSection(growContours, "Positive"))
      : outline2D;

  const base = outlineWithGrow.extrude(input.style.baseThicknessMm);

  return applyReliefToBase(
    base,
    input.style,
    input.reliefComponents,
    CrossSection,
  );
};
