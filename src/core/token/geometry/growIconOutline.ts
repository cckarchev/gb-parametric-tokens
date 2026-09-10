import { getManifoldModule } from "../mesh/manifoldModule";
import { Vec2 } from "../types";

// Matches validateMinStrokeWidth.ts's own erosion offset call: same join type, same segment
// count, just the opposite (outward) sign.
const GROW_OFFSET_CIRCULAR_SEGMENTS = 32;

// Dilates an icon's own contours outward by marginMm, for the "grow" IconOverflowBehavior (see
// types.ts): the result gets unioned into the stud/disc's own outline so the token body hugs
// the icon with at least marginMm of printable material, instead of shrinking or trimming the
// icon itself (see geometry/iconPlacement.ts's placeIcon and geometry/trimIconToCircle.ts for
// those alternatives).
export const growIconOutline = async (contours: Vec2[][], marginMm: number): Promise<Vec2[][]> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const icon = new CrossSection(contours, "Positive");
  const grown = icon.offset(marginMm, "Round", 2, GROW_OFFSET_CIRCULAR_SEGMENTS);

  return grown.toPolygons();
};
