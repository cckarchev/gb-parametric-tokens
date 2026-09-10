import { flipContoursY } from "../geometry/contourTransforms";
import { groupReliefComponentsByColorGroup } from "../mesh/groupReliefComponents";
import { ContactSheetItem, FlippedContactSheetItem } from "./contactSheetSvgTypes";

// Contours arrive in the core pipeline's mathYUp world convention (same as the 3D mesh and
// buildPreviewSvg.ts). SVG's y axis points down, so rendering those coordinates unmodified
// mirrors every item top-to-bottom.
export const flipItem = (item: ContactSheetItem): FlippedContactSheetItem => {
  const flippedReliefComponents = item.reliefComponents.map((component) => ({
    ...component,
    contours: flipContoursY(component.contours),
  }));

  return {
    shape: item.shape,
    baseContours: flipContoursY(item.baseContours),
    reliefContoursByColorGroup: groupReliefComponentsByColorGroup(flippedReliefComponents),
    label: item.label,
    valid: item.valid,
    reason: item.reason,
  };
};
