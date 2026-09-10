import { filletOutline } from "../geometry/filletOutline";
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

// IconOverflowBehavior "grow"'s dilated icon footprints (see mesh/reliefComponent.ts's
// growOutline, already flattened across every icon by the caller): unioned into the outline
// here too, so the 2D preview matches the real mesh's own grown nob/disc body (buildArcTokenMesh.ts,
// buildTokenMesh.ts) instead of showing a plain circle the print itself no longer has.
export const computeBaseOutlineContours = async (
  shape: ShapeSpec,
  centerAngleDeg: number,
  growOutlineContours: Vec2[][] = [],
): Promise<Vec2[][]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;
  const grow =
    growOutlineContours.length > 0 ? new CrossSection(growOutlineContours, "Positive") : undefined;

  if (shape.type === "disc") {
    const disc = CrossSection.circle(shape.diameterMm / 2, RING_CIRCULAR_SEGMENTS);

    return (grow ? disc.add(grow) : disc).toPolygons();
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

  const withNobs = sector.add(leftNob).add(rightNob);

  // Matches buildArcTokenMesh.ts's own fillet call exactly (same shape, same radius, same point
  // in the pipeline -- before the grow union) so the preview never diverges from the real print.
  const outline =
    shape.nobFilletEnabled && shape.nobFilletRadiusMm
      ? filletOutline(withNobs, shape.nobFilletRadiusMm)
      : withNobs;

  return (grow ? outline.add(grow) : outline).toPolygons();
};
