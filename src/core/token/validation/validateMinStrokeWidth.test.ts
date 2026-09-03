import { describe, expect, it } from "vitest";

import { validateMinStrokeWidth } from "./validateMinStrokeWidth";

describe("validateMinStrokeWidth", () => {
  it("fails a bar thinner than the minimum stroke width", async () => {
    const thinBar = [
      [
        [0, 0],
        [10, 0],
        [10, 0.2],
        [0, 0.2],
      ],
    ] as [number, number][][];

    const result = await validateMinStrokeWidth(thinBar, 0.45);

    expect(result.valid).toBe(false);
    expect(result.areaAfterErosionMm2).toBe(0);
    expect(result.featureCount).toBe(1);
    expect(result.vanishedFeatureCount).toBe(1);
  });

  it("passes a bar at least as thick as the minimum stroke width", async () => {
    const thickBar = [
      [
        [0, 0],
        [10, 0],
        [10, 2],
        [0, 2],
      ],
    ] as [number, number][][];

    const result = await validateMinStrokeWidth(thickBar, 0.45);

    expect(result.valid).toBe(true);
    expect(result.areaAfterErosionMm2).toBeGreaterThan(0);
    expect(result.areaBeforeMm2).toBeGreaterThan(result.areaAfterErosionMm2);
    expect(result.featureCount).toBe(1);
    expect(result.vanishedFeatureCount).toBe(0);
  });

  // A real token composes chunky icons with hairline-thin text. A whole-union
  // "is anything left after erosion" check always passes, because the icons survive and
  // hide the vanished glyph, so the check has to look at each feature on its own.
  it("fails when one feature vanishes even though a thick neighbour survives", async () => {
    const thickSquareAndHairline = [
      [
        [0, 0],
        [16, 0],
        [16, 16],
        [0, 16],
      ],
      [
        [20, 0],
        [30, 0],
        [30, 0.08],
        [20, 0.08],
      ],
    ] as [number, number][][];

    const result = await validateMinStrokeWidth(thickSquareAndHairline, 0.45);

    expect(result.featureCount).toBe(2);
    expect(result.vanishedFeatureCount).toBe(1);
    expect(result.valid).toBe(false);
    expect(result.areaAfterErosionMm2).toBeGreaterThan(0); // the square alone masks the loss
  });

  // Erosion routinely splits a real glyph into several pieces, so a "fewer pieces than
  // before" test would call this pair valid: the dumbbell splits at its 0.2mm neck and its
  // two lobes replace the count the vanished hairline took away (measured: 2 pieces before,
  // 2 pieces after). Eroding each feature on its own is not fooled.
  it("fails a vanished feature even when another feature splits into more pieces", async () => {
    const dumbbellAndHairline = [
      [
        [0, 0],
        [10, 0],
        [10, 4],
        [5.1, 4],
        [5.1, 4.2],
        [10, 4.2],
        [10, 8],
        [0, 8],
        [0, 4.2],
        [4.9, 4.2],
        [4.9, 4],
        [0, 4],
      ],
      [
        [20, 0],
        [30, 0],
        [30, 0.08],
        [20, 0.08],
      ],
    ] as [number, number][][];

    const result = await validateMinStrokeWidth(dumbbellAndHairline, 0.45);

    expect(result.featureCount).toBe(2);
    expect(result.vanishedFeatureCount).toBe(1);
    expect(result.valid).toBe(false);
  });
});
