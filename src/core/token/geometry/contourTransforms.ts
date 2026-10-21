import type { Vec2 } from "../types";
import { DEGREES_PER_RADIAN } from "./angleConventions";

// The three rigid transforms every stage of the pipeline applies to raw contours.

// Mirrors contours across the x axis, between the pipeline's y-up space (like the mesh) and the
// y-down space of SVG and opentype.js. It reverses winding, so normalizeWinding has to run after
// it, never before.
export const flipContoursY = (contours: Vec2[][]): Vec2[][] =>
  contours.map((contour) => contour.map(([x, y]): Vec2 => [x, -y]));

export const translateContours = (contours: Vec2[][], offset: Vec2): Vec2[][] =>
  contours.map((contour) =>
    contour.map(([x, y]): Vec2 => [x + offset[0], y + offset[1]]),
  );

// Standard mathYUp CCW rotation about the origin, so an icon rotated by this and a glyph rotated
// by text/arcPlacement.ts's applyArcPlacement agree on which way a positive angle turns.
export const rotateContours = (
  contours: Vec2[][],
  rotationDeg: number,
): Vec2[][] => {
  const rotationRad = rotationDeg / DEGREES_PER_RADIAN;
  const cosRotation = Math.cos(rotationRad);
  const sinRotation = Math.sin(rotationRad);

  return contours.map((contour) =>
    contour.map(
      ([x, y]): Vec2 => [
        x * cosRotation - y * sinRotation,
        x * sinRotation + y * cosRotation,
      ],
    ),
  );
};
