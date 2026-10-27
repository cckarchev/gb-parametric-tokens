import { getManifoldModule } from "../mesh/manifoldModule";
import type { Vec2 } from "../types";
import { OFFSET_ARC_SEGMENTS, OFFSET_MITER_LIMIT } from "./circleResolution";

// The icon's footprint grown by marginMm, for overflow behavior "grow": joined
// to the stud or disc, it wraps the icon in at least marginMm of material.
export const growIconOutline = async (
  contours: Vec2[][],
  marginMm: number,
): Promise<Vec2[][]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const icon = new CrossSection(contours, "Positive");
  const grown = icon.offset(
    marginMm,
    "Round",
    OFFSET_MITER_LIMIT,
    OFFSET_ARC_SEGMENTS,
  );

  return grown.toPolygons();
};
