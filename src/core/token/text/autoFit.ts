import type { Font } from "opentype.js";

import { DEGREES_PER_RADIAN } from "../geometry/angleConventions";
import type { FitPolicy, PrintProfile } from "../types";
import { computeSingleLineFit, type SingleLineFitResult } from "./fitCascade";
import { measureFontMetrics } from "./fontMetrics";
import { measureAdvances } from "./measureAdvances";

// How far each half of a split line moves off the line's radius, one outward
// and one inward. Tuned by eye for ~5mm text; retune if the default size moves
// far from that.
const TWO_LINE_RADIUS_OFFSET_MM = 3.5;
const TRUNCATION_MARKER = "…";

type AutoFitLineInput = {
  text: string;
  sizeMm: number;
  // Tried on one line, at its own scale floor, before the text is split (see
  // LineSpec).
  fallbackSizeMm?: number;
  radiusMm: number;
  availableSweepDeg: number;
};

type AutoFitLineOutput = {
  text: string;
  sizeMm: number;
  trackingMm: number;
  radiusMm: number;
};

type AutoFitResult = {
  lines: AutoFitLineOutput[];
  truncated: boolean;
};

const arcLengthMm = (sweepDeg: number, radiusMm: number): number =>
  (sweepDeg / DEGREES_PER_RADIAN) * radiusMm;

// Everything a single fit attempt needs except the text and radius, which vary
// per call (whole line, each half of a two-line split, each truncation
// attempt).
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
  const { advancesMm, kerningsMm } = measureAdvances(
    context.font,
    text,
    context.sizeMm,
  );

  return computeSingleLineFit({
    advancesMm,
    kerningsMm,
    availableArcLengthMm: arcLengthMm(context.availableSweepDeg, radiusMm),
    minTrackingMm: context.fitPolicy.minTracking,
    maxTrackingMm: context.fitPolicy.maxTracking,
    minScale: context.effectiveMinScale,
  });
};

type SuccessfulFit = Extract<SingleLineFitResult, { fits: true }>;

// Every successful fit becomes an output line the same way: the fit's own scale
// factor applied to the nominal size, its tracking carried through, at whatever
// radius it was fitted against. Only the give-up case below builds a line any
// other way.
const toOutputLine = (
  context: FitContext,
  text: string,
  fit: SuccessfulFit,
  radiusMm: number,
): AutoFitLineOutput => ({
  text,
  sizeMm: context.sizeMm * fit.scaleFactor,
  trackingMm: fit.trackingMm,
  radiusMm,
});

const truncateToFit = (
  context: FitContext,
  text: string,
  radiusMm: number,
): AutoFitLineOutput => {
  for (let length = text.length; length > 0; length--) {
    const candidate =
      length === text.length
        ? text
        : `${text.slice(0, length)}${TRUNCATION_MARKER}`;
    const fit = fitSingleLine(context, candidate, radiusMm);

    if (fit.fits) {
      return toOutputLine(context, candidate, fit, radiusMm);
    }
  }

  return {
    text: TRUNCATION_MARKER,
    sizeMm: context.sizeMm * context.effectiveMinScale,
    trackingMm: context.fitPolicy.minTracking,
    radiusMm,
  };
};

const splitAtMiddleWhitespace = (
  text: string,
): [string, string] | undefined => {
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

const buildFitContext = (
  font: Font,
  sizeMm: number,
  availableSweepDeg: number,
  fitPolicy: FitPolicy,
  printProfile: PrintProfile,
): FitContext => {
  // Measured off the font itself, so the floor follows whichever font the token
  // uses.
  const { stemWidthRatio } = measureFontMetrics(font);
  const profileMinSizeMm = printProfile.minStrokeWidthMm / stemWidthRatio;
  const effectiveMinScale = Math.max(
    fitPolicy.minScale,
    profileMinSizeMm / sizeMm,
  );

  return { font, sizeMm, availableSweepDeg, fitPolicy, effectiveMinScale };
};

// The first context that fits the text whole on its own line, or undefined when
// none does.
const wholeLineFit = (
  contexts: FitContext[],
  input: AutoFitLineInput,
): AutoFitResult | undefined => {
  for (const context of contexts) {
    const fit = fitSingleLine(context, input.text, input.radiusMm);

    if (fit.fits) {
      return {
        lines: [toOutputLine(context, input.text, fit, input.radiusMm)],
        truncated: false,
      };
    }
  }

  return undefined;
};

// The two halves on lines either side of the line's radius, each truncated when
// it won't fit.
const splitLineFit = (
  context: FitContext,
  [firstHalf, secondHalf]: [string, string],
  radiusMm: number,
): AutoFitResult => {
  const outerRadiusMm = radiusMm + TWO_LINE_RADIUS_OFFSET_MM;
  const innerRadiusMm = radiusMm - TWO_LINE_RADIUS_OFFSET_MM;

  const firstFit = fitSingleLine(context, firstHalf, outerRadiusMm);
  const secondFit = fitSingleLine(context, secondHalf, innerRadiusMm);

  if (firstFit.fits && secondFit.fits) {
    return {
      lines: [
        toOutputLine(context, firstHalf, firstFit, outerRadiusMm),
        toOutputLine(context, secondHalf, secondFit, innerRadiusMm),
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
};

export const autoFitLine = (
  font: Font,
  input: AutoFitLineInput,
  fitPolicy: FitPolicy,
  printProfile: PrintProfile,
): AutoFitResult => {
  const context = buildFitContext(
    font,
    input.sizeMm,
    input.availableSweepDeg,
    fitPolicy,
    printProfile,
  );
  const fallbackContext =
    input.fallbackSizeMm === undefined
      ? undefined
      : buildFitContext(
          font,
          input.fallbackSizeMm,
          input.availableSweepDeg,
          fitPolicy,
          printProfile,
        );

  // The preferred size first, then the fallback, both on one line: a split
  // moves the halves far off the line's radius, so any whole-line fit beats it.
  const wholeLineContexts = fallbackContext
    ? [context, fallbackContext]
    : [context];

  const wholeLine = wholeLineFit(wholeLineContexts, input);

  if (wholeLine) {
    return wholeLine;
  }

  const split = fitPolicy.allowTwoLines
    ? splitAtMiddleWhitespace(input.text)
    : undefined;

  if (split) {
    return splitLineFit(context, split, input.radiusMm);
  }

  return {
    lines: [truncateToFit(context, input.text, input.radiusMm)],
    truncated: true,
  };
};
