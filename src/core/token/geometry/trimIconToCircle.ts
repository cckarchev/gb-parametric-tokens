import { getManifoldModule } from "../mesh/manifoldModule";
import type { Vec2 } from "../types";
import { STUD_CIRCLE_SEGMENTS } from "./circleResolution";

// Cuts off the part of an icon that reaches past a circle centered on the origin. The contours
// must already be normalized.
export const trimIconToCircle = async (
  contours: Vec2[][],
  radiusMm: number,
): Promise<Vec2[][]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const icon = new CrossSection(contours, "Positive");
  const circle = CrossSection.circle(radiusMm, STUD_CIRCLE_SEGMENTS);
  const trimmed = icon.intersect(circle);

  return trimmed.toPolygons();
};
