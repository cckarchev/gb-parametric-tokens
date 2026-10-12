import { describe, expect, it } from "vitest";

import { CatalogCondition } from "../catalogTypes";
import { buildConditionTokenSpec } from "./conditionTokenSpec";
import { buildRingTokenSpec } from "./ringTokenSpec";
import { SharedConfig } from "./tokenItem";

const sharedConfig: SharedConfig = {
  arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, studDiameterMm: 24 },
  discShape: { type: "disc", diameterMm: 25 },
  goalInfluenceShape: { type: "disc", diameterMm: 20 },
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
  printProfileId: "fdm-04",
  colorGroups: [{ id: "base", name: "Base", color: "#2B2B2B" }],
  influenceIconId: "Ratcatchers",
  nameSizeMm: 6,
  effectSizeMm: 4,
  showSecondLine: true,
  balanceTwoLineSizes: false,
  iconOverflowBehavior: "none",
};

const condition: CatalogCondition = {
  id: "knockedDown",
  name: "Knocked Down",
  iconId: "knock-down",
};
const NO_ICON_SCALE_CHANGE = 1;

describe("buildConditionTokenSpec", () => {
  it("is the ring badge with the condition's name on top and nothing below", () => {
    const spec = buildConditionTokenSpec(condition, sharedConfig);

    expect(spec.textLayout).toBe("ring");
    expect(spec.lines.map((line) => line.text)).toEqual(["Knocked Down"]);
  });

  it("wears the condition's own icon at the ring's plain scale, never the guild crest", () => {
    const spec = buildConditionTokenSpec(condition, sharedConfig);
    const plainRing = buildRingTokenSpec(
      "Knocked Down",
      undefined,
      "knock-down",
      NO_ICON_SCALE_CHANGE,
      sharedConfig,
    );

    expect(spec.icons).toEqual(plainRing.icons);
    expect(spec.icons[0].iconId).toBe("knock-down");
  });
});
