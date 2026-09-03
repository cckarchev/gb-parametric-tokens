import {
  computeEffectiveNobDiameterMm,
  computeInnerRadiusMm,
  computeNobPlacements,
  computeOuterRadiusMm,
  computeSweepDeg,
} from "../geometry/nobPlacement";
import { getManifoldModule } from "../mesh/manifoldModule";
import { ShapeSpec, Vec2 } from "../types";

const RING_CIRCULAR_SEGMENTS = 128;
const WEDGE_STEPS = 64;
const WEDGE_RADIUS_PADDING_MM = 10; // extends the wedge past outerR so float error never clips the ring

export const computeBaseOutlineContours = async (
  shape: ShapeSpec,
  centerAngleDeg: number,
): Promise<Vec2[][]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  if (shape.type === "disc") {
    return CrossSection.circle(shape.diameterMm / 2, RING_CIRCULAR_SEGMENTS).toPolygons();
  }

  const outerRadiusMm = computeOuterRadiusMm(shape);
  const sweepDeg = computeSweepDeg(shape);
  const outer = CrossSection.circle(outerRadiusMm, RING_CIRCULAR_SEGMENTS);
  const inner = CrossSection.circle(computeInnerRadiusMm(), RING_CIRCULAR_SEGMENTS);
  const ring = outer.subtract(inner);

  const startAngleDeg = centerAngleDeg - sweepDeg / 2;
  const endAngleDeg = centerAngleDeg + sweepDeg / 2;
  const wedgeRadiusMm = outerRadiusMm + WEDGE_RADIUS_PADDING_MM;

  const wedgePoints: Vec2[] = [[0, 0]];

  for (let step = 0; step <= WEDGE_STEPS; step++) {
    const angleDeg = startAngleDeg + ((endAngleDeg - startAngleDeg) * step) / WEDGE_STEPS;
    const angleRad = (angleDeg * Math.PI) / 180;

    wedgePoints.push([Math.cos(angleRad) * wedgeRadiusMm, Math.sin(angleRad) * wedgeRadiusMm]);
  }

  const wedge = new CrossSection([wedgePoints], "Positive");
  const sector = ring.intersect(wedge);

  const nobPlacements = computeNobPlacements(shape, centerAngleDeg);
  const nobRadiusMm = computeEffectiveNobDiameterMm(shape) / 2;
  const leftNob = CrossSection.circle(nobRadiusMm, RING_CIRCULAR_SEGMENTS).translate(
    nobPlacements.left.position,
  );
  const rightNob = CrossSection.circle(nobRadiusMm, RING_CIRCULAR_SEGMENTS).translate(
    nobPlacements.right.position,
  );

  return sector.add(leftNob).add(rightNob).toPolygons();
};
