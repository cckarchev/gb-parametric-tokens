import { getManifoldModule } from "../mesh/manifoldModule";
import { Vec2 } from "../types";

// Matches buildArcTokenMesh.ts's NOB_CIRCULAR_SEGMENTS: the trimmed edge shouldn't read as any
// more or less faceted than the physical nob/disc circle it's being cut to.
const TRIM_CIRCLE_SEGMENTS = 48;

// Clips an icon's own contours (already normalized -- see computeReliefComponentsShared.ts's
// buildIconComponent, which calls this right after normalizeWinding, before rotate/translate) to
// a circle centered on the origin, cutting off whatever part of the icon pokes past it instead of
// shrinking the whole icon (see geometry/iconPlacement.ts's placeIcon for that alternative).
export const trimIconToCircle = async (contours: Vec2[][], radiusMm: number): Promise<Vec2[][]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const icon = new CrossSection(contours, "Positive");
  const circle = CrossSection.circle(radiusMm, TRIM_CIRCLE_SEGMENTS);
  const trimmed = icon.intersect(circle);

  return trimmed.toPolygons();
};
