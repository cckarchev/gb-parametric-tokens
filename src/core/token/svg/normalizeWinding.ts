import type { Vec2 } from "../types";

export const signedArea = (contour: Vec2[]): number => {
  let sum = 0;

  for (let i = 0; i < contour.length; i++) {
    const [x0, y0] = contour[i];
    const [x1, y1] = contour[(i + 1) % contour.length];

    sum += x0 * y1 - x1 * y0;
  }

  return sum / 2;
};

const isPointInsideContour = (point: Vec2, contour: Vec2[]): boolean => {
  let inside = false;

  for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
    const [xi, yi] = contour[i];
    const [xj, yj] = contour[j];

    const straddlesRay = yi > point[1] !== yj > point[1];
    const crossesToTheRight =
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

    if (straddlesRay && crossesToTheRight) {
      inside = !inside;
    }
  }

  return inside;
};

const countEnclosingContours = (
  contour: Vec2[],
  allContours: Vec2[][],
  selfIndex: number,
): number => {
  let depth = 0;

  for (let i = 0; i < allContours.length; i++) {
    if (i === selfIndex) {
      continue;
    }

    if (isPointInsideContour(contour[0], allContours[i])) {
      depth += 1;
    }
  }

  return depth;
};

export const normalizeWinding = (contours: Vec2[][]): Vec2[][] =>
  contours.map((contour, index) => {
    const nestingDepth = countEnclosingContours(contour, contours, index);
    const shouldBeCounterClockwise = nestingDepth % 2 === 0;
    const isCounterClockwise = signedArea(contour) > 0;

    if (isCounterClockwise === shouldBeCounterClockwise) {
      return contour;
    }

    return [...contour].reverse();
  });
