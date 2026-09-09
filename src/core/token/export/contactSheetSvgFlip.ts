import { groupReliefComponentsByColorGroup } from "../mesh/groupReliefComponents";
import { Vec2 } from "../types";
import { ContactSheetItem, FlippedContactSheetItem } from "./contactSheetSvgTypes";

// Contours arrive in the core pipeline's mathYUp world convention (same as the 3D mesh and
// buildPreviewSvg.ts). SVG's y axis points down, so rendering those coordinates unmodified
// mirrors every item top-to-bottom.
const flipY = (contours: Vec2[][]): Vec2[][] => {
  return contours.map((contour) => contour.map(([x, y]): Vec2 => [x, -y]));
};

export const flipItem = (item: ContactSheetItem): FlippedContactSheetItem => {
  const flippedReliefComponents = item.reliefComponents.map((component) => ({
    ...component,
    contours: flipY(component.contours),
  }));

  return {
    shape: item.shape,
    baseContours: flipY(item.baseContours),
    reliefContoursByColorGroup: groupReliefComponentsByColorGroup(flippedReliefComponents),
    label: item.label,
    valid: item.valid,
    reason: item.reason,
  };
};
