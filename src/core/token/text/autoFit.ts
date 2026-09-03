import type { Font } from "opentype.js";

import { FitPolicy, PrintProfile } from "../types";
import { computeSingleLineFit, SingleLineFitResult } from "./fitCascade";
import { measureAdvances } from "./measureAdvances";

// "l" glyph bbox width in Cooper Black at sizeMm = 1, measured live against the real font
// file; not font-agnostic, remeasure if the default font ever changes again.
const DEFAULT_FONT_STEM_WIDTH_MM_PER_SIZE_MM = 0.363;
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

const fitSingleLine = (
  font: Font,
  text: string,
  sizeMm: number,
  radiusMm: number,
  availableSweepDeg: number,
  fitPolicy: FitPolicy,
  effectiveMinScale: number,
): SingleLineFitResult => {
  const { advancesMm, kerningsMm } = measureAdvances(font, text, sizeMm);

  return computeSingleLineFit({
    advancesMm,
    kerningsMm,
    availableArcLengthMm: arcLengthMm(availableSweepDeg, radiusMm),
    minTrackingMm: fitPolicy.minTracking,
    maxTrackingMm: fitPolicy.maxTracking,
    minScale: effectiveMinScale,
  });
};

const truncateToFit = (
  font: Font,
  text: string,
  sizeMm: number,
  radiusMm: number,
  availableSweepDeg: number,
  fitPolicy: FitPolicy,
  effectiveMinScale: number,
): AutoFitLineOutput => {
  for (let length = text.length; length > 0; length--) {
    const candidate =
      length === text.length ? text : `${text.slice(0, length)}${TRUNCATION_MARKER}`;
    const fit = fitSingleLine(
      font,
      candidate,
      sizeMm,
      radiusMm,
      availableSweepDeg,
      fitPolicy,
      effectiveMinScale,
    );

    if (fit.fits) {
      return {
        text: candidate,
        sizeMm: sizeMm * fit.scaleFactor,
        trackingMm: fit.trackingMm,
        radiusMm,
      };
    }
  }

  return {
    text: TRUNCATION_MARKER,
    sizeMm: sizeMm * effectiveMinScale,
    trackingMm: fitPolicy.minTracking,
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

  const wholeLineFit = fitSingleLine(
    font,
    input.text,
    input.sizeMm,
    input.radiusMm,
    input.availableSweepDeg,
    fitPolicy,
    effectiveMinScale,
  );

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

    const firstFit = fitSingleLine(
      font,
      firstHalf,
      input.sizeMm,
      outerRadiusMm,
      input.availableSweepDeg,
      fitPolicy,
      effectiveMinScale,
    );
    const secondFit = fitSingleLine(
      font,
      secondHalf,
      input.sizeMm,
      innerRadiusMm,
      input.availableSweepDeg,
      fitPolicy,
      effectiveMinScale,
    );

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
        truncateToFit(
          font,
          firstHalf,
          input.sizeMm,
          outerRadiusMm,
          input.availableSweepDeg,
          fitPolicy,
          effectiveMinScale,
        ),
        truncateToFit(
          font,
          secondHalf,
          input.sizeMm,
          innerRadiusMm,
          input.availableSweepDeg,
          fitPolicy,
          effectiveMinScale,
        ),
      ],
      truncated: true,
    };
  }

  return {
    lines: [
      truncateToFit(
        font,
        input.text,
        input.sizeMm,
        input.radiusMm,
        input.availableSweepDeg,
        fitPolicy,
        effectiveMinScale,
      ),
    ],
    truncated: true,
  };
};
