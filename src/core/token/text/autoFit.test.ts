import path from "node:path";
import { describe, expect, it } from "vitest";

import { PRINT_PROFILES } from "../printProfiles";
import type { FitPolicy } from "../types";
import { autoFitLine } from "./autoFit";
import {
  DEFAULT_DISPLAY_FONT_ID,
  findFontEntry,
  fontFilePath,
} from "./fontCatalog";
import { loadFontFile, loadTestFont } from "./testFont";

const fitPolicy: FitPolicy = {
  minTracking: 0,
  maxTracking: 0.3,
  minScale: 0.5,
  allowTwoLines: true,
};
const printProfile = PRINT_PROFILES["fdm-04"];

const LINE_SIZE_MM = 5;
const FLOAT_TOLERANCE = 1e-9;

describe("autoFitLine", () => {
  it("floors the shrink at the size where the font's own stroke still prints", () => {
    const displayEntry = findFontEntry(DEFAULT_DISPLAY_FONT_ID);
    const displayFont = loadFontFile(
      path.join(process.cwd(), "public", fontFilePath(displayEntry.file)),
    );
    const noFloorPolicy: FitPolicy = {
      ...fitPolicy,
      minScale: 0,
      allowTwoLines: false,
    };

    // Far too long for the sweep, so it shrinks all the way to the floor and is
    // then truncated.
    const result = autoFitLine(
      displayFont,
      {
        text: "Superior Strategy Additional",
        sizeMm: LINE_SIZE_MM,
        radiusMm: 30,
        availableSweepDeg: 10,
      },
      noFloorPolicy,
      printProfile,
    );

    const floorSizeMm =
      printProfile.minStrokeWidthMm / displayEntry.metrics.stemWidthRatio;
    const bodyFloorSizeMm =
      printProfile.minStrokeWidthMm /
      findFontEntry(undefined).metrics.stemWidthRatio;

    // The truncated text lands at or a little above this font's floor, well
    // under the floor of the body font's thinner stroke.
    expect(result.lines[0].sizeMm).toBeGreaterThanOrEqual(floorSizeMm);
    expect(result.lines[0].sizeMm).toBeLessThan(bodyFloorSizeMm);
  });
});

describe("autoFitLine shrinking", () => {
  it("leaves short text unchanged when it already fits comfortably", () => {
    const font = loadTestFont();

    const result = autoFitLine(
      font,
      {
        text: "Impetus",
        sizeMm: LINE_SIZE_MM,
        radiusMm: 40,
        availableSweepDeg: 108,
      },
      fitPolicy,
      printProfile,
    );

    expect(result.truncated).toBe(false);
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].text).toBe("Impetus");
    expect(result.lines[0].sizeMm).toBe(LINE_SIZE_MM);
  });

  it("shrinks the scale when the sweep is too tight for tracking alone to fix", () => {
    const font = loadTestFont();

    // Measured against the real font: this sweep needs a scale of ~0.71, just
    // above the print profile's floor of ~0.698. Too tight for tracking alone,
    // loose enough to stay on one line. Remeasure if the font changes.
    const result = autoFitLine(
      font,
      {
        text: "Additional activation",
        sizeMm: LINE_SIZE_MM,
        radiusMm: 34,
        availableSweepDeg: 44,
      },
      fitPolicy,
      printProfile,
    );

    expect(result.truncated).toBe(false);
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].sizeMm).toBeLessThan(LINE_SIZE_MM);
    expect(result.lines[0].sizeMm).toBeGreaterThanOrEqual(
      LINE_SIZE_MM * fitPolicy.minScale - FLOAT_TOLERANCE,
    );
  });
});

describe("autoFitLine splitting and fallback", () => {
  it("splits into two lines when a single line cannot fit even at minScale", () => {
    const font = loadTestFont();

    // Measured against the real font: at 54 degrees the line doesn't fit even
    // at the floor scale, but each half fits at its own radius. At 55 it
    // already fits on one line.
    const result = autoFitLine(
      font,
      {
        text: "Superior Strategy Additional",
        sizeMm: 6,
        radiusMm: 37.5,
        availableSweepDeg: 54,
      },
      fitPolicy,
      printProfile,
    );

    expect(result.truncated).toBe(false);
    expect(result.lines.length).toBe(2);
    expect(`${result.lines[0].text} ${result.lines[1].text}`).toBe(
      "Superior Strategy Additional",
    );
    expect(result.lines[0].radiusMm).not.toBe(result.lines[1].radiusMm);
  });

  it("tries the fallback size on one line before splitting", () => {
    const font = loadTestFont();
    const fallbackSizeMm = 4;
    // Resin, because fdm-04's thickest-stroke floor (~3.5mm text) is the same
    // for both sizes and would hide the fallback.
    const resinProfile = PRINT_PROFILES.resin;

    // Same text and sweep as the split case above, which only splits because
    // 6mm is too big.
    const result = autoFitLine(
      font,
      {
        text: "Superior Strategy Additional",
        sizeMm: 6,
        fallbackSizeMm,
        radiusMm: 37.5,
        availableSweepDeg: 54,
      },
      fitPolicy,
      resinProfile,
    );

    expect(result.truncated).toBe(false);
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].text).toBe("Superior Strategy Additional");
    expect(result.lines[0].sizeMm).toBeLessThanOrEqual(fallbackSizeMm);
  });
});

describe("autoFitLine fallback and truncation", () => {
  it("ignores the fallback size when the line already fits at its own size", () => {
    const font = loadTestFont();

    const result = autoFitLine(
      font,
      {
        text: "Impetus",
        sizeMm: LINE_SIZE_MM,
        fallbackSizeMm: 3,
        radiusMm: 40,
        availableSweepDeg: 108,
      },
      fitPolicy,
      printProfile,
    );

    expect(result.lines.map((line) => line.sizeMm)).toEqual([LINE_SIZE_MM]);
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
      "This sentence is absurdly long for such a small available arc length"
        .length,
    );
  });
});
