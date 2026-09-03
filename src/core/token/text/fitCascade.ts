const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

export type SingleLineFitInput = {
  advancesMm: number[];
  kerningsMm: number[];
  availableArcLengthMm: number;
  minTrackingMm: number;
  maxTrackingMm: number;
  minScale: number;
};

export type SingleLineFitResult =
  | { fits: true; trackingMm: number; scaleFactor: number }
  | { fits: false };

export const computeSingleLineFit = (input: SingleLineFitInput): SingleLineFitResult => {
  const advanceSumMm = sum(input.advancesMm);
  const kerningSumMm = sum(input.kerningsMm);
  const gapCount = input.kerningsMm.length;

  const widthAtMaxTrackingMm = advanceSumMm + kerningSumMm + input.maxTrackingMm * gapCount;

  if (widthAtMaxTrackingMm <= input.availableArcLengthMm) {
    return { fits: true, trackingMm: input.maxTrackingMm, scaleFactor: 1 };
  }

  const widthAtMinTrackingMm = advanceSumMm + kerningSumMm + input.minTrackingMm * gapCount;

  if (widthAtMinTrackingMm <= input.availableArcLengthMm) {
    const exactTrackingMm =
      gapCount === 0
        ? input.minTrackingMm
        : (input.availableArcLengthMm - advanceSumMm - kerningSumMm) / gapCount;

    return { fits: true, trackingMm: exactTrackingMm, scaleFactor: 1 };
  }

  const glyphSpanMm = advanceSumMm + kerningSumMm;

  if (glyphSpanMm === 0) {
    return { fits: true, trackingMm: input.minTrackingMm, scaleFactor: 1 };
  }

  const scaleFactorNeeded =
    (input.availableArcLengthMm - input.minTrackingMm * gapCount) / glyphSpanMm;

  if (scaleFactorNeeded >= input.minScale) {
    return { fits: true, trackingMm: input.minTrackingMm, scaleFactor: scaleFactorNeeded };
  }

  return { fits: false };
};
