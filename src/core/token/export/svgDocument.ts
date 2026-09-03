import { computeBounds } from "../geometry/computeBounds";
import { Vec2 } from "../types";

const DEFAULT_PADDING_MM = 5;

type SvgDocumentOptions = {
  paddingMm?: number;
};

export const contourToPathSegment = (contour: Vec2[]): string => {
  const [first, ...rest] = contour;
  const moveTo = `M${first[0]},${first[1]}`;
  const lineTos = rest.map(([x, y]) => `L${x},${y}`).join(" ");

  return `${moveTo} ${lineTos} Z`;
};

export const contoursToSvgDocument = (
  contours: Vec2[][],
  options: SvgDocumentOptions = {},
): string => {
  const paddingMm = options.paddingMm ?? DEFAULT_PADDING_MM;
  const bounds = computeBounds(contours);

  const viewBoxX = bounds.min[0] - paddingMm;
  const viewBoxY = bounds.min[1] - paddingMm;
  const viewBoxWidth = bounds.max[0] - bounds.min[0] + paddingMm * 2;
  const viewBoxHeight = bounds.max[1] - bounds.min[1] + paddingMm * 2;

  const pathData = contours.map(contourToPathSegment).join(" ");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}">`,
    `<path d="${pathData}" fill="black" fill-rule="evenodd" />`,
    "</svg>",
  ].join("\n");
};
