import type { CrossSection } from "manifold-3d";

import { OFFSET_ARC_SEGMENTS, OFFSET_MITER_LIMIT } from "./circleResolution";

// Rounds inside corners by growing the outline by filletRadiusMm and shrinking it back. Only
// concave corners gain material; convex edges come back unchanged.
export const filletOutline = (section: CrossSection, filletRadiusMm: number): CrossSection => {
  return section
    .offset(filletRadiusMm, "Round", OFFSET_MITER_LIMIT, OFFSET_ARC_SEGMENTS)
    .offset(-filletRadiusMm, "Round", OFFSET_MITER_LIMIT, OFFSET_ARC_SEGMENTS);
};
