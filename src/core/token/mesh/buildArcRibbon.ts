import type { CrossSection, Manifold, ManifoldToplevel } from "manifold-3d";

import { DEGREES_PER_RADIAN } from "../geometry/angleConventions";
import { BODY_CIRCLE_SEGMENTS } from "../geometry/circleResolution";
import {
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeSweepDeg,
} from "../geometry/studPlacement";
import type { ArcShapeSpec, Vec2 } from "../types";
import { getManifoldModule } from "./manifoldModule";

const WEDGE_STEPS = 64;
// Extends the wedge past the ribbon's outer radius so float error never clips
// the ring it cuts.
const WEDGE_RADIUS_PADDING_MM = 10;

// The ribbon's flat outline, before extrusion, so the studs can be joined and
// filleted in 2D.
export const buildArcRibbonOutline2D = (
  CrossSectionCtor: ManifoldToplevel["CrossSection"],
  shape: ArcShapeSpec,
  centerAngleDeg: number,
): CrossSection => {
  const outerRadiusMm = computeOuterRadiusMm(shape);
  const sweepDeg = computeSweepDeg(shape);
  const outer = CrossSectionCtor.circle(outerRadiusMm, BODY_CIRCLE_SEGMENTS);
  const inner = CrossSectionCtor.circle(
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

  const wedge = new CrossSectionCtor([wedgePoints], "Positive");

  return ring.intersect(wedge);
};

export const buildArcRibbon = async (
  shape: ArcShapeSpec,
  centerAngleDeg: number,
  heightMm: number,
): Promise<Manifold> => {
  const wasm = await getManifoldModule();
  const sector = buildArcRibbonOutline2D(
    wasm.CrossSection,
    shape,
    centerAngleDeg,
  );

  return sector.extrude(heightMm);
};
