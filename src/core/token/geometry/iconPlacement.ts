import { Vec2 } from "../types";
import { computeBounds } from "./computeBounds";
import { flipContoursY } from "./contourTransforms";

type IconPlacementOptions = {
  targetDiameterMm: number;
  scale: number;
  // Shrinks an icon that would reach past the circle until it fits (behavior "shrink").
  // `overflowsCircle` is reported either way.
  constrainToCircle: boolean;
};

type PlaceIconResult = {
  contours: Vec2[][];
  // Whether the icon, fitted by its bounding box, reaches past the circle, whether or not
  // constrainToCircle then corrected it.
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
  // Not multiplied by options.scale: the limit is the physical circle, whatever size the icon
  // was asked to be.
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
