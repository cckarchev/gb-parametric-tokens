import type { Vec2 } from "../types";

// Which piece of the token a relief component came from, so a failed
// min-stroke-width check (see validation/validateMinStrokeWidth.ts) can name it
// instead of just counting details.
export type ReliefComponentSource =
  | { kind: "text"; text: string }
  | { kind: "icon"; iconId: string }
  | { kind: "decoration" };

export type ReliefComponent = {
  contours: Vec2[][];
  colorGroup?: string;
  source: ReliefComponentSource;
  // An icon that reaches past its circle with overflow behavior "none". The
  // other behaviors fix the overflow and leave this unset.
  overflowsCircle?: boolean;
  // An overflowing icon with behavior "grow": its footprint plus a margin, in
  // the same space as `contours`. The mesh and the preview add it to the stud
  // or disc body.
  growOutline?: Vec2[][];
};

// Every grown icon footprint as one contour list, empty when no icon grew.
export const collectGrowOutlineContours = (
  components: ReliefComponent[],
): Vec2[][] => components.flatMap((component) => component.growOutline ?? []);
