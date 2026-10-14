import { describe, expect, it } from "vitest";

import { DEFAULT_BODY_FONT_ID, DEFAULT_DISPLAY_FONT_ID } from "../../text/fontCatalog";
import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { mergeWithDefaults, parseSettingsFile } from "./parseSettingsFile";

const LEGACY_FILE = {
  arcShape: { type: "arc", ribbonWidthMm: 20, ribbonLengthMm: 25, studDiameterMm: 30 },
  discShape: { type: "disc", diameterMm: 30 },
  goalInfluenceShape: { type: "disc", diameterMm: 24 },
  style: { relief: "engraved", reliefHeightMm: 0.8, baseThicknessMm: 4 },
  fitPolicy: { minTracking: 0, maxTracking: 0.2, minScale: 0.6, allowTwoLines: false },
  printProfileId: "fdm-04",
  colorGroups: [{ id: "base", name: "Body", color: "#123456" }],
  influenceIconId: "blank",
  nameSizeMm: 5,
  effectSizeMm: 3,
  showSecondLine: false,
  balanceTwoLineSizes: true,
};

describe("mergeWithDefaults", () => {
  it("fills missing nested keys from the defaults", () => {
    const merged = mergeWithDefaults({ a: { b: 1, c: 2 } }, { a: { b: 5 } });

    expect(merged).toEqual({ a: { b: 5, c: 2 } });
  });

  it("falls back to the default when the value has the wrong type", () => {
    const merged = mergeWithDefaults({ a: 1, list: [1] }, { a: "x", list: { 0: 2 } });

    expect(merged).toEqual({ a: 1, list: [1] });
  });

  it("replaces arrays whole instead of merging them", () => {
    const merged = mergeWithDefaults({ list: [1, 2, 3] }, { list: [9] });

    expect(merged).toEqual({ list: [9] });
  });

  it("keeps optional keys the defaults lack", () => {
    const merged = mergeWithDefaults(
      { shape: { diameterMm: 15 } },
      { shape: { diameterMm: 20, innerDiameterMm: 8 } },
    );

    expect(merged).toEqual({ shape: { diameterMm: 20, innerDiameterMm: 8 } });
  });
});

describe("parseSettingsFile", () => {
  it("loads a file exported before the tuning groups existed, filling them with defaults", () => {
    const config = parseSettingsFile(LEGACY_FILE);

    expect(config.nameSizeMm).toBe(5);
    expect(config.discShape).toEqual({ type: "disc", diameterMm: 30 });
    expect(config.colorGroups).toEqual(LEGACY_FILE.colorGroups);
    expect(config.aoe).toEqual(DEFAULT_SHARED_CONFIG.aoe);
    expect(config.iconOverflowBehavior).toBe("grow");
    expect(config.aoeTemplateVariant).toBe("ring");
  });

  it("keeps a partial tuning group's own values and fills the rest", () => {
    const config = parseSettingsFile({
      ...LEGACY_FILE,
      aoe: { crowfoot: { spokeCount: 4 } },
    });

    expect(config.aoe.crowfoot.spokeCount).toBe(4);
    expect(config.aoe.crowfoot.spokeWidthMm).toBe(DEFAULT_SHARED_CONFIG.aoe.crowfoot.spokeWidthMm);
    expect(config.aoe.bandWidthMm).toBe(DEFAULT_SHARED_CONFIG.aoe.bandWidthMm);
  });

  it("falls back to the default for an option value this app does not know", () => {
    const config = parseSettingsFile({
      ...LEGACY_FILE,
      style: { ...LEGACY_FILE.style, relief: "embossed" },
      printProfileId: "fdm-99",
      iconOverflowBehavior: "explode",
      aoeTemplateVariant: "square",
    });

    expect(config.style.relief).toBe(DEFAULT_SHARED_CONFIG.style.relief);
    expect(config.style.reliefHeightMm).toBe(LEGACY_FILE.style.reliefHeightMm);
    expect(config.printProfileId).toBe(DEFAULT_SHARED_CONFIG.printProfileId);
    expect(config.iconOverflowBehavior).toBe(DEFAULT_SHARED_CONFIG.iconOverflowBehavior);
    expect(config.aoeTemplateVariant).toBe(DEFAULT_SHARED_CONFIG.aoeTemplateVariant);
  });

  it("keeps every option value this app knows", () => {
    const config = parseSettingsFile({
      ...LEGACY_FILE,
      iconOverflowBehavior: "trim",
      aoeTemplateVariant: "crowfoot",
    });

    expect(config.style.relief).toBe("engraved");
    expect(config.printProfileId).toBe("fdm-04");
    expect(config.iconOverflowBehavior).toBe("trim");
    expect(config.aoeTemplateVariant).toBe("crowfoot");
  });

  it("falls back to each group's default font for a font this app does not have", () => {
    const config = parseSettingsFile({
      ...LEGACY_FILE,
      characterToken: { fontId: "comic-sans" },
      ringBadge: { fontId: "comic-sans" },
      momentum: { fontId: "comic-sans" },
      aoe: { fontId: "comic-sans" },
    });

    expect(config.characterToken.fontId).toBe(DEFAULT_SHARED_CONFIG.characterToken.fontId);
    expect(config.ringBadge.fontId).toBe(DEFAULT_SHARED_CONFIG.ringBadge.fontId);
    expect(config.momentum.fontId).toBe(DEFAULT_SHARED_CONFIG.momentum.fontId);
    expect(config.aoe.fontId).toBe(DEFAULT_SHARED_CONFIG.aoe.fontId);
  });

  it("keeps a font this app has", () => {
    const config = parseSettingsFile({
      ...LEGACY_FILE,
      characterToken: { fontId: DEFAULT_DISPLAY_FONT_ID },
      momentum: { fontId: DEFAULT_BODY_FONT_ID },
    });

    expect(config.characterToken.fontId).toBe(DEFAULT_DISPLAY_FONT_ID);
    expect(config.momentum.fontId).toBe(DEFAULT_BODY_FONT_ID);
  });

  it("rejects something that is not a settings file at all", () => {
    expect(() => parseSettingsFile({})).toThrow("This file is not a valid settings file.");
    expect(() => parseSettingsFile(null)).toThrow("This file is not a valid settings file.");
    expect(() => parseSettingsFile([])).toThrow("This file is not a valid settings file.");
  });
});
