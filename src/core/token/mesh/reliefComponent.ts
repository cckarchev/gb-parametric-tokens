import { Vec2 } from "../types";

// Which piece of the token a relief component came from, so a failed min-stroke-width check
// (see validation/validateMinStrokeWidth.ts) can name it instead of just counting details.
// "unknown" only exists for a component built with no source attached (never happens via the
// real pipeline -- every real builder tags its own components -- kept only as a type-safe
// fallback for the odd hand-built ReliefComponent literal in geometry/mesh tests).
export type ReliefComponentSource =
  | { kind: "text"; text: string }
  | { kind: "icon"; iconId: string }
  | { kind: "decoration" }
  | { kind: "unknown" };

export type ReliefComponent = {
  contours: Vec2[][];
  colorGroup?: string;
  source?: ReliefComponentSource;
  // Set only by an icon component (see computeReliefComponentsShared.ts's buildIconComponent):
  // true when the icon's own artwork pokes past its target circle AND nothing corrected it
  // (IconSpec.overflowBehavior is "none", the default) -- "shrink", "trim", and "grow" all clear
  // this once they've handled it, so it drives the "needs attention" list without
  // double-reporting an already-handled icon.
  overflowsCircle?: boolean;
  // Set only by an icon component whose overflowBehavior is "grow" and that actually overflowed:
  // the icon's own footprint, dilated outward (see geometry/growIconOutline.ts), in the same
  // absolute mm space as `contours`. The base builders (buildArcTokenMesh.ts, buildTokenMesh.ts)
  // and the 2D preview outline (preview/computeBaseOutlineContours.ts) union this into the
  // stud/disc's own body instead of leaving it a plain circle.
  growOutline?: Vec2[][];
};

// Every grown icon footprint in one flat contour list, ready to union into a token body. All
// three consumers named on growOutline above need exactly this, and an empty result means no
// icon asked to grow, so each of them can skip the union entirely.
export const collectGrowOutlineContours = (components: ReliefComponent[]): Vec2[][] => {
  return components.flatMap((component) => component.growOutline ?? []);
};
