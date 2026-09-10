import { describe, expect, it } from "vitest";

import { FitPolicy, PrintProfile } from "../types";
import { autoFitLine } from "./autoFit";
import { loadTestFont } from "./testFont";

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

    // availableSweepDeg chosen so the required scale (~0.71, measured live against the real
    // Saira Condensed Bold font and measureAdvances) lands just above this print profile's
    // effectiveMinScale (~0.698, since Saira Condensed Bold's thin stems put the
    // print-profile-derived floor back above fitPolicy.minScale, same situation as Anton had):
    // tight enough that tracking alone can't fix it, loose enough not to force a two-line split
    // (that split starts at availableSweepDeg 44 for this same text/size/radius). Remeasure if
    // the font ever changes again, since a bolder or narrower font shifts both the required
    // scale and the floor.
    const result = autoFitLine(
      font,
      { text: "Additional activation", sizeMm: 5, radiusMm: 34, availableSweepDeg: 44 },
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

    // availableSweepDeg=54 chosen live against the real Saira Condensed Bold font: it's the
    // tightest sweep where the whole line still fails to fit (even shrunk to
    // effectiveMinScale) but each half, at its own offset radius, fits without truncation
    // (availableSweepDeg=55 already fits as a single line).
    const result = autoFitLine(
      font,
      { text: "Superior Strategy Additional", sizeMm: 6, radiusMm: 37.5, availableSweepDeg: 54 },
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
