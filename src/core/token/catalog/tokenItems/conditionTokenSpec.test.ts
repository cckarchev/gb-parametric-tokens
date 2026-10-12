import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import conditionsData from "../../../../data/conditions.json";
import { placeIcon } from "../../geometry/iconPlacement";
import { extractPathData } from "../../svg/extractPathData";
import { flattenPath } from "../../svg/flattenPath";
import { parsePathData } from "../../svg/parsePathData";
import { CatalogCondition } from "../catalogTypes";
import { buildConditionTokenSpec } from "./conditionTokenSpec";
import { SharedConfig } from "./tokenItem";

const CONDITION_ICONS_DIR = new URL("../../../../../public/icons/conditions/", import.meta.url);
const FLATTEN_TOLERANCE_MM = 0.01;
// Clear of the rim by at least this much: a raised icon is never clipped to the disc, so anything
// past the edge prints as an overhang (see iconPlacement.ts).
const MIN_RIM_MARGIN_MM = 1;

const loadIconContours = (iconId: string) => {
  const svgSource = readFileSync(new URL(`${iconId}.svg`, CONDITION_ICONS_DIR), "utf8");
  const pathData = extractPathData(svgSource);

  return pathData.flatMap((d) => flattenPath(parsePathData(d), FLATTEN_TOLERANCE_MM));
};

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
describe("buildConditionTokenSpec", () => {
  it("is a Goal Influence sized disc with no text at all", () => {
    const spec = buildConditionTokenSpec(condition, sharedConfig);

    expect(spec.shape).toEqual(sharedConfig.goalInfluenceShape);
    expect(spec.lines).toEqual([]);
  });

  it("wears only the condition's own icon, centered", () => {
    const spec = buildConditionTokenSpec(condition, sharedConfig);
    const [icon] = spec.icons;

    expect(spec.icons).toHaveLength(1);
    expect(icon.iconId).toBe("knock-down");
    expect(icon.side).toBe("center");
  });

  it("multiplies the icon's scale by the condition's own iconScale", () => {
    const iconScale = 1.2;
    const plainScale = buildConditionTokenSpec(condition, sharedConfig).icons[0].scale;
    const scaledSpec = buildConditionTokenSpec({ ...condition, iconScale }, sharedConfig);

    expect(scaledSpec.icons[0].scale).toBeCloseTo(plainScale * iconScale);
  });

  it("keeps every condition's icon clear of the disc's rim", () => {
    const discRadiusMm = sharedConfig.goalInfluenceShape.diameterMm / 2;
    const maxIconRadiusMm = discRadiusMm - MIN_RIM_MARGIN_MM;

    const overflowingIconIds = conditionsData
      .filter((catalogCondition) => {
        const spec = buildConditionTokenSpec(catalogCondition, sharedConfig);
        const placed = placeIcon(loadIconContours(catalogCondition.iconId), {
          targetDiameterMm: sharedConfig.goalInfluenceShape.diameterMm,
          scale: spec.icons[0].scale,
          constrainToCircle: false,
        });
        const farthestPointMm = Math.max(
          ...placed.contours.flat().map(([x, y]) => Math.hypot(x, y)),
        );

        return farthestPointMm > maxIconRadiusMm;
      })
      .map((catalogCondition) => catalogCondition.iconId);

    expect(overflowingIconIds).toEqual([]);
  });
});
