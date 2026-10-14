import type { Font, PathCommand } from "opentype.js";

// The two numbers text fitting needs from a font, each a fraction of the font size.
export type FontMetrics = {
  // How high a capital's top sits above the baseline. Not the font's `ascender`, which leaves
  // room for accents this text never uses.
  ascentRatio: number;
  // The thickness of an "l"'s stroke, standing in for the font's stroke width: the thinnest text
  // that still prints is the size where this matches the print profile's minimum stroke.
  stemWidthRatio: number;
};

type Point = { x: number; y: number };

const CAPITAL_REFERENCE_GLYPH = "H";
const STEM_REFERENCE_GLYPH = "l";
// Points each curve is split into when the outline is flattened. Plenty for a stroke edge,
// which is close to straight at mid-height.
const CURVE_SAMPLE_COUNT = 16;

const sampleQuadratic = (from: Point, control: Point, to: Point): Point[] => {
  return Array.from({ length: CURVE_SAMPLE_COUNT }, (_, index) => {
    const t = (index + 1) / CURVE_SAMPLE_COUNT;
    const u = 1 - t;

    return {
      x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
      y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
    };
  });
};

const sampleCubic = (from: Point, control1: Point, control2: Point, to: Point): Point[] => {
  return Array.from({ length: CURVE_SAMPLE_COUNT }, (_, index) => {
    const t = (index + 1) / CURVE_SAMPLE_COUNT;
    const u = 1 - t;

    return {
      x:
        u * u * u * from.x +
        3 * u * u * t * control1.x +
        3 * u * t * t * control2.x +
        t * t * t * to.x,
      y:
        u * u * u * from.y +
        3 * u * u * t * control1.y +
        3 * u * t * t * control2.y +
        t * t * t * to.y,
    };
  });
};

// The outline as closed polygons, in font units.
const flattenOutline = (commands: PathCommand[]): Point[][] => {
  const contours: Point[][] = [];
  let current: Point[] = [];

  for (const command of commands) {
    if (command.type === "M") {
      if (current.length > 0) {
        contours.push(current);
      }

      current = [{ x: command.x, y: command.y }];
    } else if (command.type === "L") {
      current.push({ x: command.x, y: command.y });
    } else if (command.type === "Q") {
      const from = current[current.length - 1];
      const control = { x: command.x1, y: command.y1 };

      current.push(...sampleQuadratic(from, control, { x: command.x, y: command.y }));
    } else if (command.type === "C") {
      const from = current[current.length - 1];
      const control1 = { x: command.x1, y: command.y1 };
      const control2 = { x: command.x2, y: command.y2 };

      current.push(...sampleCubic(from, control1, control2, { x: command.x, y: command.y }));
    }
  }

  if (current.length > 0) {
    contours.push(current);
  }

  return contours;
};

// Where the outline crosses the horizontal line at y, left to right.
const crossingsAt = (contours: Point[][], y: number): number[] => {
  const crossings: number[] = [];

  for (const contour of contours) {
    contour.forEach((start, index) => {
      const end = contour[(index + 1) % contour.length];
      const spansY = (start.y <= y && end.y > y) || (end.y <= y && start.y > y);

      if (!spansY) {
        return;
      }

      const t = (y - start.y) / (end.y - start.y);

      crossings.push(start.x + (end.x - start.x) * t);
    });
  }

  return crossings.sort((a, b) => a - b);
};

// The widest run of ink across the glyph at half its height: for an "l", the stroke itself,
// clear of the serifs or the tail at its foot that widen its outline.
const measureStemWidthUnits = (font: Font): number => {
  const glyph = font.charToGlyph(STEM_REFERENCE_GLYPH);
  const bounds = glyph.getBoundingBox();
  const midHeight = (bounds.y1 + bounds.y2) / 2;
  const crossings = crossingsAt(flattenOutline(glyph.path.commands), midHeight);

  let widestRun = 0;

  for (let index = 0; index + 1 < crossings.length; index += 2) {
    widestRun = Math.max(widestRun, crossings[index + 1] - crossings[index]);
  }

  return widestRun;
};

// Text fitting asks once per line, so each font is measured once. Weak, so a font that is no
// longer used can still be collected.
const metricsByFont = new WeakMap<Font, FontMetrics>();

export const measureFontMetrics = (font: Font): FontMetrics => {
  const cachedMetrics = metricsByFont.get(font);

  if (cachedMetrics) {
    return cachedMetrics;
  }

  const capitalBounds = font.charToGlyph(CAPITAL_REFERENCE_GLYPH).getBoundingBox();
  const metrics: FontMetrics = {
    ascentRatio: capitalBounds.y2 / font.unitsPerEm,
    stemWidthRatio: measureStemWidthUnits(font) / font.unitsPerEm,
  };

  metricsByFont.set(font, metrics);

  return metrics;
};
