import { describe, expect, it } from "vitest";

import { PRINT_PROFILES } from "./printProfiles";

describe("PRINT_PROFILES", () => {
  it("has the fdm-04 profile with the numbers from SPEC §7", () => {
    const profile = PRINT_PROFILES["fdm-04"];

    expect(profile).toMatchObject({
      minStrokeWidthMm: 0.45,
      minReliefHeightMm: 0.4,
      defaultRelief: "raised",
    });
  });

  it("has the resin profile with the numbers from SPEC §7", () => {
    const profile = PRINT_PROFILES.resin;

    expect(profile).toMatchObject({
      minStrokeWidthMm: 0.1,
      minReliefHeightMm: 0.1,
      defaultRelief: "engraved",
    });
  });

  it("has an fdm-025 profile finer than fdm-04, scaled for a 0.25mm nozzle", () => {
    const fine = PRINT_PROFILES["fdm-025"];
    const standard = PRINT_PROFILES["fdm-04"];

    expect(fine.minStrokeWidthMm).toBeLessThan(standard.minStrokeWidthMm);
    expect(fine.minReliefHeightMm).toBeLessThan(standard.minReliefHeightMm);
    expect(fine.minFeatureGapMm).toBeLessThan(standard.minFeatureGapMm);
    expect(fine.defaultRelief).toBe("raised");
  });
});
