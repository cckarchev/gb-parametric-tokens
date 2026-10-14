import { describe, expect, it } from "vitest";

import { PRINT_PROFILES } from "../printProfiles";
import { FitPolicy } from "../types";
import { autoFitLine } from "./autoFit";
import { loadTestFont } from "./testFont";

const fitPolicy: FitPolicy = {
  minTracking: 0,
  maxTracking: 0.3,
  minScale: 0.5,
  allowTwoLines: true,
};
const printProfile = PRINT_PROFILES["fdm-04"];

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

    // Measured against the real font: this sweep needs a scale of ~0.71, just above the print
    // profile's floor of ~0.698. Too tight for tracking alone, loose enough to stay on one line.
    // Remeasure if the font changes.
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

    // Measured against the real font: at 54 degrees the line doesn't fit even at the floor scale,
    // but each half fits at its own radius. At 55 it already fits on one line.
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
