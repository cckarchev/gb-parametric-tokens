import { DEGREES_PER_RADIAN } from "../geometry/angleConventions";
import { BODY_CIRCLE_SEGMENTS } from "../geometry/circleResolution";
import { buildDiscFootprint } from "../geometry/discFootprint";
import { filletOutline } from "../geometry/filletOutline";
import {
  computeEffectiveStudDiameterMm,
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeStudPlacements,
  computeSweepDeg,
} from "../geometry/studPlacement";
import { getManifoldModule } from "../mesh/manifoldModule";
import type { ShapeSpec, Vec2 } from "../types";

const WEDGE_STEPS = 64;
// Extends the wedge past the ribbon's outer radius so float error never clips the ring it cuts.
const WEDGE_RADIUS_PADDING_MM = 10;

// growOutlineContours are the footprints of icons with overflow behavior "grow". They join the
// outline here as they do in the mesh, so the preview shows the grown body that gets printed.
export const computeBaseOutlineContours = async (
  shape: ShapeSpec,
  centerAngleDeg: number,
  growOutlineContours: Vec2[][] = [],
): Promise<Vec2[][]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;
  const grow =
    growOutlineContours.length > 0
      ? new CrossSection(growOutlineContours, "Positive")
      : undefined;

  if (shape.type === "disc") {
    const disc = buildDiscFootprint(CrossSection, shape);

    return (grow ? disc.add(grow) : disc).toPolygons();
  }

  const outerRadiusMm = computeOuterRadiusMm(shape);
  const sweepDeg = computeSweepDeg(shape);
  const outer = CrossSection.circle(outerRadiusMm, BODY_CIRCLE_SEGMENTS);
  const inner = CrossSection.circle(
    computeInnerRadiusMm(),
    BODY_CIRCLE_SEGMENTS,
  );
  const ring = outer.subtract(inner);

  const startAngleDeg = centerAngleDeg - sweepDeg / 2;
  const endAngleDeg = centerAngleDeg + sweepDeg / 2;
  const wedgeRadiusMm = outerRadiusMm + WEDGE_RADIUS_PADDING_MM;

  const wedgePoints: Vec2[] = [[0, 0]];

  for (let step = 0; step <= WEDGE_STEPS; step++) {
    const angleDeg =
      startAngleDeg + ((endAngleDeg - startAngleDeg) * step) / WEDGE_STEPS;
    const angleRad = angleDeg / DEGREES_PER_RADIAN;

    wedgePoints.push([
      Math.cos(angleRad) * wedgeRadiusMm,
      Math.sin(angleRad) * wedgeRadiusMm,
    ]);
  }

  const wedge = new CrossSection([wedgePoints], "Positive");
  const sector = ring.intersect(wedge);

  const studPlacements = computeStudPlacements(shape, centerAngleDeg);
  const studRadiusMm = computeEffectiveStudDiameterMm(shape) / 2;
  const leftStud = CrossSection.circle(
    studRadiusMm,
    BODY_CIRCLE_SEGMENTS,
  ).translate(studPlacements.left.position);
  const rightStud = CrossSection.circle(
    studRadiusMm,
    BODY_CIRCLE_SEGMENTS,
  ).translate(studPlacements.right.position);

  const withStuds = sector.add(leftStud).add(rightStud);

  // Matches buildArcTokenMesh.ts's own fillet call exactly (same shape, same radius, same point
  // in the pipeline, before the grow union) so the preview never diverges from the real print.
  const outline =
    shape.studFilletEnabled && shape.studFilletRadiusMm
      ? filletOutline(withStuds, shape.studFilletRadiusMm)
      : withStuds;

  return (grow ? outline.add(grow) : outline).toPolygons();
};
