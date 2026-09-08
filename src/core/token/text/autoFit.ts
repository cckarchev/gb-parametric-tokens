import type { Font } from "opentype.js";

import { FitPolicy, PrintProfile } from "../types";
import { computeSingleLineFit, SingleLineFitResult } from "./fitCascade";
import { measureAdvances } from "./measureAdvances";

// "l" glyph bbox width in Saira Condensed Bold at sizeMm = 1, measured live against the real
// font file; not font-agnostic, remeasure if the default font ever changes again.
const DEFAULT_FONT_STEM_WIDTH_MM_PER_SIZE_MM = 0.129;
// mirrors the old scad's `shift = size / 2 + 1` for ~5mm text.
const TWO_LINE_RADIUS_OFFSET_MM = 3.5;
const TRUNCATION_MARKER = "…";

export type AutoFitLineInput = {
  text: string;
  sizeMm: number;
  radiusMm: number;
  availableSweepDeg: number;
};

export type AutoFitLineOutput = {
  text: string;
  sizeMm: number;
  trackingMm: number;
  radiusMm: number;
};

export type AutoFitResult = {
  lines: AutoFitLineOutput[];
  truncated: boolean;
};

const arcLengthMm = (sweepDeg: number, radiusMm: number): number => {
  return (sweepDeg * Math.PI * radiusMm) / 180;
};

// Everything a single fit attempt needs except the text and radius, which vary per call
// (whole line, each half of a two-line split, each truncation attempt).
type FitContext = {
  font: Font;
  sizeMm: number;
  availableSweepDeg: number;
  fitPolicy: FitPolicy;
  effectiveMinScale: number;
};

const fitSingleLine = (
  context: FitContext,
  text: string,
  radiusMm: number,
): SingleLineFitResult => {
  const { advancesMm, kerningsMm } = measureAdvances(context.font, text, context.sizeMm);

  return computeSingleLineFit({
    advancesMm,
    kerningsMm,
    availableArcLengthMm: arcLengthMm(context.availableSweepDeg, radiusMm),
    minTrackingMm: context.fitPolicy.minTracking,
    maxTrackingMm: context.fitPolicy.maxTracking,
    minScale: context.effectiveMinScale,
  });
};

const truncateToFit = (context: FitContext, text: string, radiusMm: number): AutoFitLineOutput => {
  for (let length = text.length; length > 0; length--) {
    const candidate =
      length === text.length ? text : `${text.slice(0, length)}${TRUNCATION_MARKER}`;
    const fit = fitSingleLine(context, candidate, radiusMm);

    if (fit.fits) {
      return {
        text: candidate,
        sizeMm: context.sizeMm * fit.scaleFactor,
        trackingMm: fit.trackingMm,
        radiusMm,
      };
    }
  }

  return {
    text: TRUNCATION_MARKER,
    sizeMm: context.sizeMm * context.effectiveMinScale,
    trackingMm: context.fitPolicy.minTracking,
    radiusMm,
  };
};

const splitAtMiddleWhitespace = (text: string): [string, string] | undefined => {
  const middleIndex = text.length / 2;
  let bestSpaceIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < text.length; index++) {
    if (text[index] === " ") {
      const distance = Math.abs(index - middleIndex);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestSpaceIndex = index;
      }
    }
  }

  if (bestSpaceIndex === -1) {
    return undefined;
  }

  return [text.slice(0, bestSpaceIndex), text.slice(bestSpaceIndex + 1)];
};

export const autoFitLine = (
  font: Font,
  input: AutoFitLineInput,
  fitPolicy: FitPolicy,
  printProfile: PrintProfile,
): AutoFitResult => {
  const profileMinSizeMm = printProfile.minStrokeWidthMm / DEFAULT_FONT_STEM_WIDTH_MM_PER_SIZE_MM;
  const effectiveMinScale = Math.max(fitPolicy.minScale, profileMinSizeMm / input.sizeMm);
  const context: FitContext = {
    font,
    sizeMm: input.sizeMm,
    availableSweepDeg: input.availableSweepDeg,
    fitPolicy,
    effectiveMinScale,
  };

  const wholeLineFit = fitSingleLine(context, input.text, input.radiusMm);

  if (wholeLineFit.fits) {
    return {
      lines: [
        {
          text: input.text,
          sizeMm: input.sizeMm * wholeLineFit.scaleFactor,
          trackingMm: wholeLineFit.trackingMm,
          radiusMm: input.radiusMm,
        },
      ],
      truncated: false,
    };
  }

  const split = fitPolicy.allowTwoLines ? splitAtMiddleWhitespace(input.text) : undefined;

  if (split) {
    const [firstHalf, secondHalf] = split;
    const outerRadiusMm = input.radiusMm + TWO_LINE_RADIUS_OFFSET_MM;
    const innerRadiusMm = input.radiusMm - TWO_LINE_RADIUS_OFFSET_MM;

    const firstFit = fitSingleLine(context, firstHalf, outerRadiusMm);
    const secondFit = fitSingleLine(context, secondHalf, innerRadiusMm);

    if (firstFit.fits && secondFit.fits) {
      return {
        lines: [
          {
            text: firstHalf,
            sizeMm: input.sizeMm * firstFit.scaleFactor,
            trackingMm: firstFit.trackingMm,
            radiusMm: outerRadiusMm,
          },
          {
            text: secondHalf,
            sizeMm: input.sizeMm * secondFit.scaleFactor,
            trackingMm: secondFit.trackingMm,
            radiusMm: innerRadiusMm,
          },
        ],
        truncated: false,
      };
    }

    return {
      lines: [
        truncateToFit(context, firstHalf, outerRadiusMm),
        truncateToFit(context, secondHalf, innerRadiusMm),
      ],
      truncated: true,
    };
  }

  return {
    lines: [truncateToFit(context, input.text, input.radiusMm)],
    truncated: true,
  };
};
