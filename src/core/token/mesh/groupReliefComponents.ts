import { Vec2 } from "../types";
import { resolveColorGroupId } from "./colorGroups";
import { ReliefComponent } from "./reliefComponent";

export const groupReliefComponentsByColorGroup = (
  components: ReliefComponent[],
): Map<string, Vec2[][]> => {
  const grouped = new Map<string, Vec2[][]>();

  for (const component of components) {
    const colorGroupId = resolveColorGroupId(component.colorGroup);
    const existingContours = grouped.get(colorGroupId) ?? [];

    grouped.set(colorGroupId, [...existingContours, ...component.contours]);
  }

  return grouped;
};
