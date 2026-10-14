import { getManifoldModule } from "../mesh/manifoldModule";
import { Vec2 } from "../types";
import { STUD_CIRCLE_SEGMENTS } from "./circleResolution";

// Clips an icon's own contours (already normalized, see computeReliefComponentsShared.ts's
// buildIconComponent, which calls this right after normalizeWinding, before rotate/translate) to
// a circle centered on the origin, cutting off whatever part of the icon pokes past it instead of
// shrinking the whole icon (see geometry/iconPlacement.ts's placeIcon for that alternative).
export const trimIconToCircle = async (contours: Vec2[][], radiusMm: number): Promise<Vec2[][]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const icon = new CrossSection(contours, "Positive");
  const circle = CrossSection.circle(radiusMm, STUD_CIRCLE_SEGMENTS);
  const trimmed = icon.intersect(circle);

  return trimmed.toPolygons();
};
