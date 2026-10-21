import {
  DEGREES_PER_RADIAN,
  RADIAL_TO_UPRIGHT_OFFSET_DEG,
} from "../geometry/angleConventions";
import type { Vec2 } from "../types";
import { computePenPositions } from "./measureAdvances";

type ArcGlyphPlacement = {
  angleDeg: number;
  position: Vec2;
  rotationDeg: number;
  // From the glyph's pen start (x = 0) to the point it pivots on when placed on the arc: its
  // horizontal center. Pivoting on the pen start makes wide glyphs lean off the curve.
  pivotOffsetMm: number;
};

// Which way the tops of the letters point. "outward" (away from the center) suits text along the
// top of a circle. "inward" suits the bottom, so it still reads upright, left to right, like the
// bottom band of a coin.
export type ArcOrientation = "outward" | "inward";

type ArcGlyphPlacementInput = {
  advancesMm: number[];
  kerningsMm: number[];
  radiusMm: number;
  centerAngleDeg: number;
  coordinateConvention: "svgYDown" | "mathYUp";
  orientation?: ArcOrientation;
};

export const computeArcGlyphPlacements = (
  input: ArcGlyphPlacementInput,
): ArcGlyphPlacement[] => {
  const penPositions = computePenPositions(input.advancesMm, input.kerningsMm);
  const lastIndex = input.advancesMm.length - 1;
  const totalWidthMm = penPositions[lastIndex] + input.advancesMm[lastIndex];
  const orientation = input.orientation ?? "outward";
  // Outward, the angle falls as the text advances; inward it rises, so both read left to right.
  const orientationSignMultiplier = orientation === "outward" ? -1 : 1;

  return penPositions.map((penPosition, index): ArcGlyphPlacement => {
    const pivotOffsetMm = input.advancesMm[index] / 2;
    const glyphCenterMm = penPosition + pivotOffsetMm;
    const arcLengthFromCenterMm = glyphCenterMm - totalWidthMm / 2;
    const angleDeg =
      input.centerAngleDeg +
      orientationSignMultiplier *
        (arcLengthFromCenterMm / input.radiusMm) *
        DEGREES_PER_RADIAN;
    const angleRad = angleDeg / DEGREES_PER_RADIAN;

    // svgYDown writes straight into SVG space, so y and the rotation are mirrored. mathYUp is
    // the mesh's y-up world and needs no compensation.
    const position: Vec2 =
      input.coordinateConvention === "svgYDown"
        ? [
            input.radiusMm * Math.cos(angleRad),
            -input.radiusMm * Math.sin(angleRad),
          ]
        : [
            input.radiusMm * Math.cos(angleRad),
            input.radiusMm * Math.sin(angleRad),
          ];

    // A quarter turn either side of the point's polar angle (see RADIAL_TO_UPRIGHT_OFFSET_DEG).
    const mathYUpRotationDeg =
      orientation === "outward"
        ? angleDeg - RADIAL_TO_UPRIGHT_OFFSET_DEG
        : angleDeg + RADIAL_TO_UPRIGHT_OFFSET_DEG;
    const rotationDeg =
      input.coordinateConvention === "svgYDown"
        ? -mathYUpRotationDeg
        : mathYUpRotationDeg;

    return { angleDeg, position, rotationDeg, pivotOffsetMm };
  });
};

export const applyArcPlacement = (
  contours: Vec2[][],
  placement: ArcGlyphPlacement,
): Vec2[][] => {
  const rotationRad = placement.rotationDeg / DEGREES_PER_RADIAN;
  const cosRotation = Math.cos(rotationRad);
  const sinRotation = Math.sin(rotationRad);

  return contours.map((contour) =>
    contour.map(([x, y]): Vec2 => {
      const pivotedX = x - placement.pivotOffsetMm;
      const rotatedX = pivotedX * cosRotation - y * sinRotation;
      const rotatedY = pivotedX * sinRotation + y * cosRotation;

      return [
        rotatedX + placement.position[0],
        rotatedY + placement.position[1],
      ];
    }),
  );
};
