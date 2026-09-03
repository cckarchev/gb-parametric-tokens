import type { Manifold } from "manifold-3d";

import {
  ArcShapeSpec,
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeSweepDeg,
} from "../geometry/nobPlacement";
import { getManifoldModule } from "./manifoldModule";

const RING_CIRCULAR_SEGMENTS = 128;
const WEDGE_STEPS = 64;
const WEDGE_RADIUS_PADDING_MM = 10; // extends the wedge past outerR so float error never clips the ring

export const buildArcRibbon = async (
  shape: ArcShapeSpec,
  centerAngleDeg: number,
  heightMm: number,
): Promise<Manifold> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const outerRadiusMm = computeOuterRadiusMm(shape);
  const sweepDeg = computeSweepDeg(shape);
  const outer = CrossSection.circle(outerRadiusMm, RING_CIRCULAR_SEGMENTS);
  const inner = CrossSection.circle(computeInnerRadiusMm(), RING_CIRCULAR_SEGMENTS);
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

  const wedge = new CrossSection([wedgePoints], "Positive");
  const sector = ring.intersect(wedge);

  return sector.extrude(heightMm);
};
