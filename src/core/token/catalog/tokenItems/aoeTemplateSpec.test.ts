import { describe, expect, it } from "vitest";

import { CatalogAoeTemplate } from "../catalogTypes";
import { buildAoeTemplateSpec } from "./aoeTemplateSpec";
import { SharedConfig } from "./tokenItem";

const sharedConfig: SharedConfig = {
  arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, studDiameterMm: 24 },
  discShape: { type: "disc", diameterMm: 25 },
  goalInfluenceShape: { type: "disc", diameterMm: 20 },
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
  printProfileId: "fdm-04",
  colorGroups: [{ id: "base", name: "Base", color: "#2B2B2B" }],
  influenceIconId: "Alchemists",
  nameSizeMm: 6,
  effectSizeMm: 4,
  showSecondLine: true,
  balanceTwoLineSizes: false,
  iconOverflowBehavior: "none",
};

const template: CatalogAoeTemplate = { id: "smokeBomb", name: "Smoke Bomb", effect: "Cover" };
const BAND_MID_RADIUS_MM = 35.1;

describe("buildAoeTemplateSpec", () => {
  it("is a fixed 3 inch hollow disc whatever the shared shapes say", () => {
    const spec = buildAoeTemplateSpec(template, sharedConfig);

    expect(spec.shape.type).toBe("disc");
    expect(spec.shape.type === "disc" && spec.shape.diameterMm).toBeCloseTo(76.2);
    expect(spec.shape.type === "disc" && spec.shape.innerDiameterMm).toBeCloseTo(64.2);
    expect(spec.textLayout).toBe("ring");
  });

  it("puts the name on top and the effect below, their ink centered on the band", () => {
    const spec = buildAoeTemplateSpec(template, sharedConfig);
    const [topLine, bottomLine] = spec.lines;
    const radiusSum = (topLine.radiusMm ?? 0) + (bottomLine.radiusMm ?? 0);

    expect(topLine.text).toBe("Smoke Bomb");
    expect(bottomLine.text).toBe("Cover");
    expect(topLine.radiusMm).toBeLessThan(BAND_MID_RADIUS_MM);
    expect(bottomLine.radiusMm).toBeGreaterThan(BAND_MID_RADIUS_MM);
    expect(radiusSum).toBeCloseTo(BAND_MID_RADIUS_MM * 2);
  });

  it("carries no icons, only its text", () => {
    const spec = buildAoeTemplateSpec(template, sharedConfig);

    expect(spec.icons).toEqual([]);
  });
});
