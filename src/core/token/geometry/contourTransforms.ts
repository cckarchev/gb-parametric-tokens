import { Vec2 } from "../types";
import { DEGREES_PER_RADIAN } from "./angleConventions";

// The three rigid transforms every stage of the pipeline applies to raw contours. Each of these
// used to exist as a private copy per module (a `flipY` in iconPlacement.ts, another in
// buildPreviewSvg.ts, a third in contact-sheet/flip.ts; a `shift` here, an `offsetContour`
// there), so this is one home for all of them rather than a new abstraction.

// Mirrors contours across the x axis. Used at every boundary between this app's two coordinate
// conventions: the core pipeline works in mathYUp (y grows upward, same as the 3D mesh), SVG and
// opentype.js both work y-down. A y-flip reverses contour winding, so svg/normalizeWinding.ts has
// to run AFTER this, never before: the ordering trap documented at each call site.
export const flipContoursY = (contours: Vec2[][]): Vec2[][] => {
  return contours.map((contour) => contour.map(([x, y]): Vec2 => [x, -y]));
};

export const translateContours = (contours: Vec2[][], offset: Vec2): Vec2[][] => {
  return contours.map((contour) => contour.map(([x, y]): Vec2 => [x + offset[0], y + offset[1]]));
};

// Standard mathYUp CCW rotation about the origin, so an icon rotated by this and a glyph rotated
// by text/arcPlacement.ts's applyArcPlacement agree on which way a positive angle turns.
export const rotateContours = (contours: Vec2[][], rotationDeg: number): Vec2[][] => {
  const rotationRad = rotationDeg / DEGREES_PER_RADIAN;
  const cosRotation = Math.cos(rotationRad);
  const sinRotation = Math.sin(rotationRad);

  return contours.map((contour) =>
    contour.map(
      ([x, y]): Vec2 => [x * cosRotation - y * sinRotation, x * sinRotation + y * cosRotation],
    ),
  );
};
