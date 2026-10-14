import { normalizeWinding } from "../svg/normalizeWinding";
import { Vec2 } from "../types";
import { BODY_CIRCLE_SEGMENTS } from "./circleResolution";

const buildCirclePolygon = (radiusMm: number): Vec2[] => {
  return Array.from({ length: BODY_CIRCLE_SEGMENTS }, (_, index): Vec2 => {
    const angleRad = (index / BODY_CIRCLE_SEGMENTS) * 2 * Math.PI;

    return [radiusMm * Math.cos(angleRad), radiusMm * Math.sin(angleRad)];
  });
};

// A flat ring widthMm wide, centered on radiusMm. The inner circle is wound as a hole.
export const computeRingContour = (radiusMm: number, widthMm: number): Vec2[][] => {
  const outer = buildCirclePolygon(radiusMm + widthMm / 2);
  const inner = buildCirclePolygon(radiusMm - widthMm / 2);

  return normalizeWinding([outer, inner]);
};
