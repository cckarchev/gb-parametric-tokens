import { readFileSync } from "fs";
import opentype from "opentype.js";
import path from "path";
import { describe, expect, it } from "vitest";

import { FitPolicy, PrintProfile } from "../types";
import { autoFitLine } from "./autoFit";

const loadTestFont = () => {
  const buffer = readFileSync(path.join(process.cwd(), "public/fonts/CooperBlack.otf"));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  return opentype.parse(arrayBuffer);
};

const fitPolicy: FitPolicy = {
  minTracking: 0,
  maxTracking: 0.3,
  minScale: 0.5,
  allowTwoLines: true,
};
const printProfile: PrintProfile = {
  id: "fdm-04",
  name: "FDM 0.4mm",
  minStrokeWidthMm: 0.45,
  minReliefHeightMm: 0.4,
  minFeatureGapMm: 0.4,
  bezierToleranceMm: 0.1,
  defaultRelief: "raised",
};

describe("autoFitLine", () => {
  it("leaves short text unchanged when it already fits comfortably", () => {
    const font = loadTestFont();

    const result = autoFitLine(
      font,
      { text: "Impetus", sizeMm: 5, radiusMm: 40, availableSweepDeg: 108 },
      fitPolicy,
      printProfile,
    );

    expect(result.truncated).toBe(false);
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].text).toBe("Impetus");
    expect(result.lines[0].sizeMm).toBe(5);
  });

  it("shrinks the scale when the sweep is too tight for tracking alone to fix", () => {
    const font = loadTestFont();

    // availableSweepDeg chosen so the required scale (~0.51, measured live against the real
    // Cooper Black font and measureAdvances) lands between this print profile's
    // effectiveMinScale (0.5, since Cooper Black's much thicker stems keep the
    // print-profile-derived floor below fitPolicy.minScale) and 1: tight enough that tracking
    // alone can't fix it, loose enough not to force a two-line split. It's close to the 0.5
    // floor; remeasure if the font ever changes again, since a slightly bolder font could push
    // it under the floor and flip this into the two-line-split branch instead.
    const result = autoFitLine(
      font,
      { text: "Additional activation", sizeMm: 5, radiusMm: 34, availableSweepDeg: 50 },
      fitPolicy,
      printProfile,
    );

    expect(result.truncated).toBe(false);
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].sizeMm).toBeLessThan(5);
    expect(result.lines[0].sizeMm).toBeGreaterThanOrEqual(5 * fitPolicy.minScale - 1e-9);
  });

  it("splits into two lines when a single line cannot fit even at minScale", () => {
    const font = loadTestFont();

    // availableSweepDeg=45 chosen live against the real Cooper Black font: it's the tightest
    // sweep where the whole line still fails to fit (even shrunk to effectiveMinScale) but
    // each half, at its own offset radius, fits without truncation.
    const result = autoFitLine(
      font,
      { text: "Superior Strategy Additional", sizeMm: 6, radiusMm: 37.5, availableSweepDeg: 45 },
      fitPolicy,
      printProfile,
    );

    expect(result.truncated).toBe(false);
    expect(result.lines.length).toBe(2);
    expect(`${result.lines[0].text} ${result.lines[1].text}`).toBe("Superior Strategy Additional");
    expect(result.lines[0].radiusMm).not.toBe(result.lines[1].radiusMm);
  });

  it("truncates and flags it when nothing else fits", () => {
    const font = loadTestFont();
    const veryTightPolicy: FitPolicy = { ...fitPolicy, allowTwoLines: false };

    const result = autoFitLine(
      font,
      {
        text: "This sentence is absurdly long for such a small available arc length",
        sizeMm: 6,
        radiusMm: 37.5,
        availableSweepDeg: 20,
      },
      veryTightPolicy,
      printProfile,
    );

    expect(result.truncated).toBe(true);
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].text.endsWith("…")).toBe(true);
    expect(result.lines[0].text.length).toBeLessThan(
      "This sentence is absurdly long for such a small available arc length".length,
    );
  });
});
