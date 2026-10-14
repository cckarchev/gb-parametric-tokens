import { describe, expect, it } from "vitest";

import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { buildMomentumTokenSpec } from "./momentumTokenSpec";
import { SharedConfig } from "./tokenItem";

const DISC_DIAMETER_MM = 20;
const TEXT_SIZE_MM = 6;
const RING_INSET_MM = 1;
const RING_WIDTH_MM = 0.6;

const config: SharedConfig = {
  ...DEFAULT_SHARED_CONFIG,
  discShape: { ...DEFAULT_SHARED_CONFIG.discShape, diameterMm: DISC_DIAMETER_MM },
  momentum: { textSizeMm: TEXT_SIZE_MM, ringInsetMm: RING_INSET_MM, ringWidthMm: RING_WIDTH_MM },
};

describe("buildMomentumTokenSpec", () => {
  it("prints a fixed MP on a flat disc with no icon", () => {
    const spec = buildMomentumTokenSpec(config);

    expect(spec.shape).toBe(config.discShape);
    expect(spec.textLayout).toBe("flat");
    expect(spec.lines.map((line) => [line.text, line.sizeMm])).toEqual([["MP", TEXT_SIZE_MM]]);
    expect(spec.icons).toEqual([]);
  });

  it("prints MP in the display typeface", () => {
    const spec = buildMomentumTokenSpec(config);

    expect(spec.typeface).toBe("display");
  });

  it("places the ring centerline so its outer edge sits the inset in from the rim", () => {
    const spec = buildMomentumTokenSpec(config);
    const [ring] = spec.decorations;
    const outerEdgeMm = ring.radiusMm + ring.widthMm / 2;

    expect(spec.decorations).toHaveLength(1);
    expect(ring.type).toBe("ring");
    expect(ring.widthMm).toBe(RING_WIDTH_MM);
    expect(outerEdgeMm).toBeCloseTo(DISC_DIAMETER_MM / 2 - RING_INSET_MM);
  });

  it("never tracks, shrinks or wraps its text, whatever the shared fit policy says", () => {
    const spec = buildMomentumTokenSpec(config);

    expect(spec.fitPolicy).toEqual({
      minTracking: 0,
      maxTracking: 0,
      minScale: 1,
      allowTwoLines: false,
    });
  });
});
