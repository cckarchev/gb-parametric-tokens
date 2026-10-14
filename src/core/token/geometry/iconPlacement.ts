import { Vec2 } from "../types";
import { computeBounds } from "./computeBounds";
import { flipContoursY } from "./contourTransforms";

type IconPlacementOptions = {
  targetDiameterMm: number;
  scale: number;
  // Off by default (see IconSpec.overflowBehavior's "shrink" value): when true, an icon whose own
  // farthest point would poke past the target circle under a plain bounding-box fit is shrunk
  // further, to the circle-fit scale, instead. `overflowsCircle` below is reported either way:
  // turning this off only skips the correction, never the detection.
  constrainToCircle: boolean;
};

type PlaceIconResult = {
  contours: Vec2[][];
  // True when the icon's own farthest point from its center would poke past the target circle
  // under a plain bounding-box fit, regardless of whether constrainToCircle actually corrected
  // it. A raised relief icon is unioned onto the base with no clip against the stud/disc's own
  // circle (see applyReliefToBase.ts), so any point past that circle would print as an
  // unsupported overhang: this is what lets a caller flag that token for attention.
  overflowsCircle: boolean;
};

// A tiny tolerance so an icon whose farthest point already sits exactly on the inscribed circle
// (the box fit and the circle fit agree) isn't flagged as overflowing from float noise alone.
const OVERFLOW_EPSILON = 1e-9;

export const placeIcon = (contours: Vec2[][], options: IconPlacementOptions): PlaceIconResult => {
  const flipped = flipContoursY(contours);
  const bounds = computeBounds(flipped);

  const boundsWidth = bounds.max[0] - bounds.min[0];
  const boundsHeight = bounds.max[1] - bounds.min[1];
  const largestDimension = Math.max(boundsWidth, boundsHeight);

  const center: Vec2 = [(bounds.min[0] + bounds.max[0]) / 2, (bounds.min[1] + bounds.max[1]) / 2];
  const boxFitScaleFactor = (options.targetDiameterMm * options.scale) / largestDimension;

  const circumradius = Math.max(
    ...flipped.flatMap((contour) =>
      contour.map(([x, y]) => Math.hypot(x - center[0], y - center[1])),
    ),
  );
  // Deliberately not multiplied by options.scale, unlike boxFitScaleFactor above: the circle
  // fit is a physical safety limit (the real stud/disc circle a raised icon can't print past
  // unsupported, see applyReliefToBase.ts), not the icon's own nominal aesthetic size, so a
  // smaller scale legitimately needs less correction rather than a smaller circle to correct
  // against.
  const circleFitScaleFactor = options.targetDiameterMm / (2 * circumradius);

  const overflowsCircle = circleFitScaleFactor < boxFitScaleFactor - OVERFLOW_EPSILON;
  const scaleFactor = options.constrainToCircle
    ? Math.min(boxFitScaleFactor, circleFitScaleFactor)
    : boxFitScaleFactor;

  const placedContours = flipped.map((contour) =>
    contour.map(([x, y]): Vec2 => [(x - center[0]) * scaleFactor, (y - center[1]) * scaleFactor]),
  );

  return { contours: placedContours, overflowsCircle };
};
