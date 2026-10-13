import type { CrossSection as CrossSectionInstance, ManifoldToplevel } from "manifold-3d";

import { CrowfootSpec, DiscShapeSpec, Vec2 } from "../types";
import { CENTER_ANGLE_DEG, DEGREES_PER_RADIAN } from "./angleConventions";
import { BODY_CIRCLE_SEGMENTS, OFFSET_ARC_SEGMENTS, OFFSET_MITER_LIMIT } from "./circleResolution";
import { filletOutline } from "./filletOutline";

const FULL_TURN_DEG = 360;
const WEDGE_STEPS = 16;
// Extends each wedge past the outer radius so float error never clips the arc it cuts.
const WEDGE_RADIUS_PADDING_MM = 10;

type CrossSectionClass = ManifoldToplevel["CrossSection"];

const buildWedge = (
  CrossSection: CrossSectionClass,
  centerAngleDeg: number,
  sweepDeg: number,
  radiusMm: number,
): CrossSectionInstance => {
  const startAngleDeg = centerAngleDeg - sweepDeg / 2;
  const points: Vec2[] = [[0, 0]];

  for (let step = 0; step <= WEDGE_STEPS; step++) {
    const angleDeg = startAngleDeg + (sweepDeg * step) / WEDGE_STEPS;
    const angleRad = angleDeg / DEGREES_PER_RADIAN;

    points.push([Math.cos(angleRad) * radiusMm, Math.sin(angleRad) * radiusMm]);
  }

  return new CrossSection([points], "Positive");
};

// A straight bar from the center out along angleDeg, centered on that direction.
const buildSpoke = (
  CrossSection: CrossSectionClass,
  angleDeg: number,
  lengthMm: number,
  widthMm: number,
): CrossSectionInstance => {
  const bar = CrossSection.square([lengthMm, widthMm]).translate([0, -widthMm / 2]);

  return bar.rotate(angleDeg);
};

// Keeps only a short arc of the band at the end of each spoke, joins those arcs to the center
// with the spokes themselves, fillets the inside corners, and rounds the arcs' ends. The spokes
// run to the band's middle so each one fuses solidly into its arc instead of meeting it along a
// hairline.
const buildCrowfoot = (
  CrossSection: CrossSectionClass,
  band: CrossSectionInstance,
  crowfoot: CrowfootSpec,
  outerRadiusMm: number,
  innerRadiusMm: number,
): CrossSectionInstance => {
  // The first spoke points up, where the token's front-facing content sits; the rest follow
  // evenly around.
  const spokeStepDeg = FULL_TURN_DEG / crowfoot.spokeCount;
  const spokeLengthMm = (outerRadiusMm + innerRadiusMm) / 2;
  const wedgeRadiusMm = outerRadiusMm + WEDGE_RADIUS_PADDING_MM;
  const parts: CrossSectionInstance[] = [];

  for (let index = 0; index < crowfoot.spokeCount; index++) {
    const angleDeg = CENTER_ANGLE_DEG + spokeStepDeg * index;
    const wedge = buildWedge(CrossSection, angleDeg, crowfoot.arcSweepDeg, wedgeRadiusMm);

    parts.push(band.intersect(wedge));
    parts.push(buildSpoke(CrossSection, angleDeg, spokeLengthMm, crowfoot.spokeWidthMm));
  }

  // First a fillet (see filletOutline.ts) in every concave corner, where spokes meet arcs and
  // each other at the center: a sharp inside corner is where a print snaps. Then an opening
  // (shrink, then grow back by the same radius) rounds every convex corner, the arcs' square ends,
  // leaving those fillets alone. Safe while the spokes and the band stay wider than twice the
  // corner radius, which would otherwise vanish.
  const sharpCrowfoot = CrossSection.union(parts);
  const filleted = filletOutline(sharpCrowfoot, crowfoot.filletRadiusMm);
  const shrunk = filleted.offset(
    -crowfoot.cornerRadiusMm,
    "Round",
    OFFSET_MITER_LIMIT,
    OFFSET_ARC_SEGMENTS,
  );

  return shrunk.offset(crowfoot.cornerRadiusMm, "Round", OFFSET_MITER_LIMIT, OFFSET_ARC_SEGMENTS);
};

// The disc's flat outline before any extrusion or grow union: a plain circle, a ring when
// innerDiameterMm is set, or a crow's foot cut from that ring. Shared by the real mesh
// (mesh/buildTokenMesh.ts) and the 2D preview (preview/computeBaseOutlineContours.ts) so the two
// can never disagree about the outline.
export const buildDiscFootprint = (
  CrossSection: CrossSectionClass,
  shape: DiscShapeSpec,
): CrossSectionInstance => {
  const outerRadiusMm = shape.diameterMm / 2;
  const outer = CrossSection.circle(outerRadiusMm, BODY_CIRCLE_SEGMENTS);
  const innerRadiusMm = shape.innerDiameterMm === undefined ? 0 : shape.innerDiameterMm / 2;
  const band =
    shape.innerDiameterMm === undefined
      ? outer
      : outer.subtract(CrossSection.circle(innerRadiusMm, BODY_CIRCLE_SEGMENTS));

  if (shape.crowfoot === undefined) {
    return band;
  }

  return buildCrowfoot(CrossSection, band, shape.crowfoot, outerRadiusMm, innerRadiusMm);
};
