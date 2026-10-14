import { existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_BODY_FONT_ID,
  DEFAULT_DISPLAY_FONT_ID,
  FONT_CATALOG,
  findFontEntry,
  fontFilePath,
} from "./fontCatalog";
import { measureFontMetrics } from "./fontMetrics";
import { loadFontFile } from "./testFont";

const METRIC_PRECISION_DIGITS = 3;

const publicFilePath = (entryFile: string): string => {
  return path.join(process.cwd(), "public", fontFilePath(entryFile));
};

describe("FONT_CATALOG", () => {
  it("gives every font a unique id", () => {
    const ids = FONT_CATALOG.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes both default fonts", () => {
    const ids = FONT_CATALOG.map((entry) => entry.id);

    expect(ids).toContain(DEFAULT_BODY_FONT_ID);
    expect(ids).toContain(DEFAULT_DISPLAY_FONT_ID);
  });

  it.each(FONT_CATALOG)("ships $name's file and its license", (entry) => {
    expect(existsSync(publicFilePath(entry.file))).toBe(true);
    expect(existsSync(publicFilePath(entry.licenseFile))).toBe(true);
  });

  // The spec builders size text before any font is loaded, so they read these stored values.
  // This keeps them honest against the real file.
  it.each(FONT_CATALOG)("stores $name's measured metrics", (entry) => {
    const measured = measureFontMetrics(loadFontFile(publicFilePath(entry.file)));

    expect(entry.metrics.ascentRatio).toBeCloseTo(measured.ascentRatio, METRIC_PRECISION_DIGITS);
    expect(entry.metrics.stemWidthRatio).toBeCloseTo(
      measured.stemWidthRatio,
      METRIC_PRECISION_DIGITS,
    );
  });
});

describe("findFontEntry", () => {
  it("finds a font by its id", () => {
    expect(findFontEntry(DEFAULT_DISPLAY_FONT_ID).id).toBe(DEFAULT_DISPLAY_FONT_ID);
  });

  it("falls back to the body font for an id it doesn't know", () => {
    expect(findFontEntry("no-such-font").id).toBe(DEFAULT_BODY_FONT_ID);
  });

  it("falls back to the body font when no id is given", () => {
    expect(findFontEntry(undefined).id).toBe(DEFAULT_BODY_FONT_ID);
  });
});
