import { normalizeWinding } from "../svg/normalizeWinding";
import { Vec2 } from "../types";

const RING_SEGMENTS = 128;

const buildCirclePolygon = (radiusMm: number): Vec2[] => {
  return Array.from({ length: RING_SEGMENTS }, (_, index): Vec2 => {
    const angleRad = (index / RING_SEGMENTS) * 2 * Math.PI;

    return [radiusMm * Math.cos(angleRad), radiusMm * Math.sin(angleRad)];
  });
};

// A flat annulus centered on radiusMm, widthMm wide: an outer circle contour and an inner
// circle contour, wound so a "Positive" fill rule (Manifold's CrossSection, used for the 3D
// mesh) treats the inner circle as a hole rather than filling it in, same as any other relief
// contour with a counter (see svg/normalizeWinding.ts).
export const computeRingContour = (radiusMm: number, widthMm: number): Vec2[][] => {
  const outer = buildCirclePolygon(radiusMm + widthMm / 2);
  const inner = buildCirclePolygon(radiusMm - widthMm / 2);

  return normalizeWinding([outer, inner]);
};
