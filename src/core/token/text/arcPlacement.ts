import { DEGREES_PER_RADIAN, RADIAL_TO_UPRIGHT_OFFSET_DEG } from "../geometry/angleConventions";
import { Vec2 } from "../types";
import { computePenPositions } from "./measureAdvances";

export type ArcGlyphPlacement = {
  angleDeg: number;
  position: Vec2;
  rotationDeg: number;
  // Distance, in the glyph's own local coordinates, from its pen-start origin (x=0) to the
  // point that gets rotated in place and placed on the arc. Pivoting on the pen-start edge
  // instead of the glyph's own horizontal center swings a wide glyph's far side away from the
  // true curve, which reads as "leaning"/faceted text -- worse the wider the glyph, so it
  // barely showed with a narrow font but is obvious with a bold, wide one.
  pivotOffsetMm: number;
};

// "outward" always points a glyph's ascender away from the circle's center, reading correctly
// wherever "away from center" also happens to mean "up" on screen (e.g. text along the top of
// a ring, or the ribbon token's own arc). "inward" points the ascender toward the center
// instead, for a band on the opposite side of the same circle (e.g. the bottom of a full-disc
// ring) that still needs to read left-to-right, upright, for a viewer who never rotates the
// token -- the classic "challenge coin" bottom-band convention.
export type ArcOrientation = "outward" | "inward";

export type ArcGlyphPlacementInput = {
  advancesMm: number[];
  kerningsMm: number[];
  radiusMm: number;
  centerAngleDeg: number;
  coordinateConvention: "svgYDown" | "mathYUp";
  orientation?: ArcOrientation;
};

export const computeArcGlyphPlacements = (input: ArcGlyphPlacementInput): ArcGlyphPlacement[] => {
  const penPositions = computePenPositions(input.advancesMm, input.kerningsMm);
  const lastIndex = input.advancesMm.length - 1;
  const totalWidthMm = penPositions[lastIndex] + input.advancesMm[lastIndex];
  const orientation = input.orientation ?? "outward";
  // outward: increasing arc-length-from-center decreases the angle (existing convention).
  // inward: reversed, so reading left-to-right sweeps the same rotational direction an
  // upright viewer expects on the far side of the circle -- see ArcOrientation's doc comment.
  const orientationSignMultiplier = orientation === "outward" ? -1 : 1;

  return penPositions.map((penPosition, index): ArcGlyphPlacement => {
    const pivotOffsetMm = input.advancesMm[index] / 2;
    const glyphCenterMm = penPosition + pivotOffsetMm;
    const arcLengthFromCenterMm = glyphCenterMm - totalWidthMm / 2;
    const angleDeg =
      input.centerAngleDeg +
      orientationSignMultiplier * (arcLengthFromCenterMm / input.radiusMm) * DEGREES_PER_RADIAN;
    const angleRad = angleDeg / DEGREES_PER_RADIAN;

    // svgYDown: glyph outlines from opentype.js render upright with no flip, so writing
    // this directly into SVG (y-down) space needs the y negated and rotation mirrored to
    // compensate -- this is the exact fix from M2's postmortem, left unchanged here.
    // mathYUp: manifold-3d's 3D world is plain math convention (y-up), so no compensation
    // is needed -- this is the convention M3's mesh-building tasks use.
    const position: Vec2 =
      input.coordinateConvention === "svgYDown"
        ? [input.radiusMm * Math.cos(angleRad), -input.radiusMm * Math.sin(angleRad)]
        : [input.radiusMm * Math.cos(angleRad), input.radiusMm * Math.sin(angleRad)];

    // outward points the glyph's ascender away from the center, inward points it toward the
    // center instead -- a quarter turn either side of the point's own polar angle (see
    // RADIAL_TO_UPRIGHT_OFFSET_DEG). svgYDown always mirrors whatever mathYUp computes, same
    // relationship as before orientation existed.
    const mathYUpRotationDeg =
      orientation === "outward"
        ? angleDeg - RADIAL_TO_UPRIGHT_OFFSET_DEG
        : angleDeg + RADIAL_TO_UPRIGHT_OFFSET_DEG;
    const rotationDeg =
      input.coordinateConvention === "svgYDown" ? -mathYUpRotationDeg : mathYUpRotationDeg;

    return { angleDeg, position, rotationDeg, pivotOffsetMm };
  });
};

export const applyArcPlacement = (contours: Vec2[][], placement: ArcGlyphPlacement): Vec2[][] => {
  const rotationRad = placement.rotationDeg / DEGREES_PER_RADIAN;
  const cosRotation = Math.cos(rotationRad);
  const sinRotation = Math.sin(rotationRad);

  return contours.map((contour) =>
    contour.map(([x, y]): Vec2 => {
      const pivotedX = x - placement.pivotOffsetMm;
      const rotatedX = pivotedX * cosRotation - y * sinRotation;
      const rotatedY = pivotedX * sinRotation + y * cosRotation;

      return [rotatedX + placement.position[0], rotatedY + placement.position[1]];
    }),
  );
};
