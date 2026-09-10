import type { CrossSection, Manifold, ManifoldToplevel } from "manifold-3d";

import {
  ArcShapeSpec,
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeSweepDeg,
} from "../geometry/studPlacement";
import { getManifoldModule } from "./manifoldModule";

const RING_CIRCULAR_SEGMENTS = 128;
const WEDGE_STEPS = 64;
const WEDGE_RADIUS_PADDING_MM = 10; // extends the wedge past outerR so float error never clips the ring

// The ribbon's flat 2D sector (outer radius minus inner radius, cut down to the sweep angle),
// with no height yet -- exported so buildArcTokenMesh.ts can union studs onto it in 2D (required
// for filletOutline.ts's offset math, which only works before extrusion) instead of building this
// same ring/wedge shape a second time.
export const buildArcRibbonOutline2D = (
  CrossSectionCtor: ManifoldToplevel["CrossSection"],
  shape: ArcShapeSpec,
  centerAngleDeg: number,
): CrossSection => {
  const outerRadiusMm = computeOuterRadiusMm(shape);
  const sweepDeg = computeSweepDeg(shape);
  const outer = CrossSectionCtor.circle(outerRadiusMm, RING_CIRCULAR_SEGMENTS);
  const inner = CrossSectionCtor.circle(computeInnerRadiusMm(), RING_CIRCULAR_SEGMENTS);
  const ring = outer.subtract(inner);

  const startAngleDeg = centerAngleDeg - sweepDeg / 2;
  const endAngleDeg = centerAngleDeg + sweepDeg / 2;
  const wedgeRadiusMm = outerRadiusMm + WEDGE_RADIUS_PADDING_MM;

  const wedgePoints: [number, number][] = [[0, 0]];

  for (let step = 0; step <= WEDGE_STEPS; step++) {
    const angleDeg = startAngleDeg + ((endAngleDeg - startAngleDeg) * step) / WEDGE_STEPS;
    const angleRad = (angleDeg * Math.PI) / 180;

    wedgePoints.push([Math.cos(angleRad) * wedgeRadiusMm, Math.sin(angleRad) * wedgeRadiusMm]);
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
  const sector = buildArcRibbonOutline2D(wasm.CrossSection, shape, centerAngleDeg);

  return sector.extrude(heightMm);
};
