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
  aoeTemplateVariant: "ring",
};

const template: CatalogAoeTemplate = { id: "smokeBomb", name: "Smoke Bomb", effect: "Cover" };
const BAND_MID_RADIUS_MM = 35.1;
const BAND_INNER_RADIUS_MM = 32.1;
const GUILD_ICON_ID = "Alchemists";
const GUILD_ICON_SCALE = 1.2;
const COMPACT_ICON_SCALE = 0.55;

describe("buildAoeTemplateSpec", () => {
  it("is a fixed 3 inch hollow disc whatever the shared shapes say", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, sharedConfig);

    expect(spec.shape.type).toBe("disc");
    expect(spec.shape.type === "disc" && spec.shape.diameterMm).toBeCloseTo(76.2);
    expect(spec.shape.type === "disc" && spec.shape.innerDiameterMm).toBeCloseTo(64.2);
    expect(spec.textLayout).toBe("ring");
  });

  it("puts the name on top and the effect below, their ink centered on the band", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, sharedConfig);
    const [topLine, bottomLine] = spec.lines;
    const radiusSum = (topLine.radiusMm ?? 0) + (bottomLine.radiusMm ?? 0);

    expect(topLine.text).toBe("Smoke Bomb");
    expect(bottomLine.text).toBe("Cover");
    expect(topLine.radiusMm).toBeLessThan(BAND_MID_RADIUS_MM);
    expect(bottomLine.radiusMm).toBeGreaterThan(BAND_MID_RADIUS_MM);
    expect(radiusSum).toBeCloseTo(BAND_MID_RADIUS_MM * 2);
  });

  it("carries no icons, only its text", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, sharedConfig);

    expect(spec.icons).toEqual([]);
  });
});

describe("buildAoeTemplateSpec, crow's foot variant", () => {
  const crowfootConfig: SharedConfig = { ...sharedConfig, aoeTemplateVariant: "crowfoot" };
  const CROWFOOT_TEXT_SIZE_MM = 3;
  const TOP_ANGLE_DEG = 90;
  const LOWER_LEFT_ANGLE_DEG = 210;
  const LOWER_RIGHT_ANGLE_DEG = 330;

  it("cuts the 3 inch ring down to three rounded 30 degree arcs on filleted 5mm spokes", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, crowfootConfig);

    expect(spec.shape).toEqual({
      type: "disc",
      diameterMm: expect.closeTo(76.2),
      innerDiameterMm: expect.closeTo(64.2),
      crowfoot: {
        spokeCount: 3,
        spokeWidthMm: 5,
        arcSweepDeg: 30,
        cornerRadiusMm: 1.5,
        filletRadiusMm: 3,
      },
    });
  });

  it("writes the name on every arc and the effect along every spoke, with no crest", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, crowfootConfig);
    const arcLines = spec.lines.filter((line) => line.placement !== "radial");
    const spokeLines = spec.lines.filter((line) => line.placement === "radial");
    const spokeAngles = [TOP_ANGLE_DEG, LOWER_LEFT_ANGLE_DEG, LOWER_RIGHT_ANGLE_DEG];

    expect(spec.textLayout).toBe("ring");
    expect(arcLines.map((line) => [line.text, line.centerAngleDeg])).toEqual(
      spokeAngles.map((angleDeg) => ["Smoke Bomb", angleDeg]),
    );
    expect(spokeLines.map((line) => [line.text, line.centerAngleDeg])).toEqual(
      spokeAngles.map((angleDeg) => ["Cover", angleDeg]),
    );
    expect(spec.lines.every((line) => line.sizeMm === CROWFOOT_TEXT_SIZE_MM)).toBe(true);
    expect(spec.icons).toEqual([]);
  });

  it("centers each arc name on the band, top one inside the middle, lower ones outside it", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, crowfootConfig);
    const [topName, lowerLeftName, lowerRightName] = spec.lines;

    expect(topName.radiusMm).toBeLessThan(BAND_MID_RADIUS_MM);
    expect(lowerLeftName.radiusMm).toBeGreaterThan(BAND_MID_RADIUS_MM);
    expect(lowerRightName.radiusMm).toBeGreaterThan(BAND_MID_RADIUS_MM);
  });

  it("keeps the spoke effects between the center and the band", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, crowfootConfig);
    const spokeLines = spec.lines.filter((line) => line.placement === "radial");

    for (const line of spokeLines) {
      expect(line.radiusMm).toBeGreaterThan(0);
      expect(line.radiusMm).toBeLessThan(BAND_INNER_RADIUS_MM);
    }
  });
});

describe("buildAoeTemplateSpec, compact disc variant", () => {
  const compactConfig: SharedConfig = { ...sharedConfig, aoeTemplateVariant: "compactDisc" };

  it("is a solid 1 inch disc, so the rest of the 3 inch area is a whole inch from its edge", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, compactConfig);

    expect(spec.shape.type).toBe("disc");
    expect(spec.shape.type === "disc" && spec.shape.diameterMm).toBeCloseTo(25.4);
    expect(spec.shape.type === "disc" && spec.shape.innerDiameterMm).toBeUndefined();
  });

  it("curves the name on top and the effect below", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, compactConfig);
    const [topLine, bottomLine] = spec.lines;

    expect(spec.textLayout).toBe("ring");
    expect(topLine.text).toBe("Smoke Bomb");
    expect(bottomLine.text).toBe("Cover");
    expect(bottomLine.radiusMm).toBeGreaterThan(topLine.radiusMm ?? 0);
    expect(bottomLine.radiusMm).toBeLessThan(25.4 / 2);
  });

  it("wears the guild crest at its center, scaled by the guild's own icon scale", () => {
    const spec = buildAoeTemplateSpec(template, GUILD_ICON_ID, GUILD_ICON_SCALE, compactConfig);

    expect(spec.icons).toEqual([
      {
        iconId: GUILD_ICON_ID,
        side: "center",
        scale: COMPACT_ICON_SCALE * GUILD_ICON_SCALE,
        colorGroup: "text",
      },
    ]);
  });
});
