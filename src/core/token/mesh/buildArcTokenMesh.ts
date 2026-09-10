import { STUD_CIRCLE_SEGMENTS } from "../geometry/circleResolution";
import { filletOutline } from "../geometry/filletOutline";
import { computeEffectiveStudDiameterMm } from "../geometry/studPlacement";
import { ArcShapeSpec, StyleSpec, Vec2 } from "../types";
import { applyReliefToBase } from "./applyReliefToBase";
import { buildArcRibbonOutline2D } from "./buildArcRibbon";
import { getManifoldModule } from "./manifoldModule";
import { collectGrowOutlineContours, ReliefComponent } from "./reliefComponent";
import { TokenPart } from "./tokenPart";

export type BuildArcTokenMeshInput = {
  shape: ArcShapeSpec;
  centerAngleDeg: number;
  style: StyleSpec;
  studPositions: { left: Vec2; right: Vec2 };
  reliefComponents: ReliefComponent[];
};

export const buildArcTokenMesh = async (input: BuildArcTokenMeshInput): Promise<TokenPart[]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const ribbon = buildArcRibbonOutline2D(CrossSection, input.shape, input.centerAngleDeg);
  // The effective diameter, never the raw studDiameterMm: computeStudPlacements already puts the
  // stud's center where a stud of THIS size touches the ribbon's inner-edge vertex, so building
  // the circle at the nominal size instead would draw a too-small stud around a center placed for
  // a bigger one -- leaving the ribbon's straight end edge poking out (see studPlacement.ts).
  const studRadiusMm = computeEffectiveStudDiameterMm(input.shape) / 2;

  const leftStud = CrossSection.circle(studRadiusMm, STUD_CIRCLE_SEGMENTS).translate(
    input.studPositions.left[0],
    input.studPositions.left[1],
  );

  const rightStud = CrossSection.circle(studRadiusMm, STUD_CIRCLE_SEGMENTS).translate(
    input.studPositions.right[0],
    input.studPositions.right[1],
  );

  // Filleting has to happen in 2D, before extrusion (filletOutline.ts's offset math has no 3D
  // equivalent), which is why the ribbon and studs are unioned as flat CrossSections here instead
  // of each being extruded and unioned as solids the way this used to work.
  const withStuds = ribbon.add(leftStud).add(rightStud);
  const outline2D =
    input.shape.studFilletEnabled && input.shape.studFilletRadiusMm
      ? filletOutline(withStuds, input.shape.studFilletRadiusMm)
      : withStuds;

  // IconOverflowBehavior "grow" (see types.ts): a stud icon that overflowed its plain circle
  // carries its own dilated footprint here (computeReliefComponentsShared.ts), already in the
  // same absolute mm space as the stud positions above, so unioning it in makes the stud's own
  // body hug the icon instead of leaving it a plain circle. Added after the fillet, not before,
  // so the fillet radius only ever smooths the stud/ribbon junction it was tuned for.
  const growContours = collectGrowOutlineContours(input.reliefComponents);
  const outlineWithGrow =
    growContours.length > 0 ? outline2D.add(new CrossSection(growContours, "Positive")) : outline2D;

  const base = outlineWithGrow.extrude(input.style.baseThicknessMm);

  return applyReliefToBase(base, input.style, input.reliefComponents, CrossSection);
};
