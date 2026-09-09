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
};
