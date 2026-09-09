import { readFileSync } from "fs";
import opentype from "opentype.js";
import path from "path";
import { describe, expect, it } from "vitest";

import { computeReliefComponents, LoadIconSource } from "./computeReliefComponents";
import { CENTER_ANGLE_DEG } from "./geometry/angleConventions";
import {
  computeInnerRadiusMm,
  computeNobPlacements,
  computeOuterRadiusMm,
} from "./geometry/nobPlacement";
import { PRINT_PROFILES } from "./printProfiles";
import { TokenSpec } from "./types";

const loadTestFont = () => {
  const buffer = readFileSync(path.join(process.cwd(), "public/fonts/SairaCondensed-Bold.ttf"));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  return opentype.parse(arrayBuffer);
};

// A diamond whose vertices sit exactly on its own bounding box's inscribed circle (see
// iconPlacement.test.ts's identical fixture): fits within a circular nob/disc with no shrink, so
// tests using this as a stand-in icon aren't incidentally exercising the icon-overflow check.
const GENERIC_ICON_SVG = '<svg><path d="M5 0L10 5L5 10L0 5Z"/></svg>';

const stubLoadIconSource: LoadIconSource = async (iconId) => {
  if (iconId === "missing-icon") {
    return { svgSource: GENERIC_ICON_SVG, resolvedId: "blank", substituted: true };
  }

  return { svgSource: GENERIC_ICON_SVG, resolvedId: iconId, substituted: false };
};

const printProfile = PRINT_PROFILES["fdm-04"];

const discSpec = (overrides: Partial<TokenSpec> = {}): TokenSpec => ({
  version: 1,
  shape: { type: "disc", diameterMm: 25 },
  textLayout: "flat",
  lines: [],
  icons: [{ iconId: "ball", side: "center", scale: 0.7 }],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: false },
  ...overrides,
});

const arcSpec = (overrides: Partial<TokenSpec> = {}): TokenSpec => ({
  version: 1,
  // ribbonLengthMm = 120deg's worth of arc, measured on the fixed inner radius (matches the
  // old sweepDeg: 120 default's proportions).
  shape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 32, nobDiameterMm: 24 },
  textLayout: "arc",
  lines: [{ text: "Momentum", sizeMm: 6 }],
  icons: [
    { iconId: "ball", side: "left", scale: 0.7 },
    { iconId: "ball", side: "right", scale: 0.7 },
  ],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
  ...overrides,
});

describe("computeReliefComponents", () => {
  it("builds one relief component per center icon for a disc shape with no lines", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec(),
      font,
      printProfile,
      stubLoadIconSource,
    );

    expect(result.reliefComponents).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });

  it("builds relief components for both center icons and lines together on a disc shape", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({ lines: [{ text: "12", sizeMm: 5 }] }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    expect(result.reliefComponents).toHaveLength(2); // 1 center icon + 1 flat line
    expect(result.warnings).toEqual([]);
  });

  it("builds a decoration component for a flat disc, not just a ring-layout one", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({
        icons: [],
        lines: [{ text: "MP", sizeMm: 6 }],
        decorations: [{ type: "ring", radiusMm: 6, widthMm: 0.6 }],
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    expect(result.reliefComponents).toHaveLength(2); // 1 line + 1 ring decoration
    expect(result.warnings).toEqual([]);
  });

  it("warns and substitutes when a disc icon is missing from the registry", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({ icons: [{ iconId: "missing-icon", side: "center", scale: 0.7 }] }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    expect(result.reliefComponents).toHaveLength(1);
    expect(result.warnings).toEqual(['Icon "missing-icon" not found, using fallback "blank".']);
  });

  it("builds relief components for both nob icons and every line on an arc shape", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(arcSpec(), font, printProfile, stubLoadIconSource);

    expect(result.reliefComponents).toHaveLength(3); // 2 nob icons + 1 line (fits on one line here)
    expect(result.warnings).toEqual([]);
  });

  it("rotates a nob icon so it turns with the arc the same way the letters beside it do", async () => {
    const font = loadTestFont();
    // Apex-up triangle: placeIcon's flip+center+scale (see iconPlacement.ts) always lands its
    // apex exactly on the local +y axis, so an unrotated icon would point it straight "north"
    // of the nob center no matter where the nob sits on the arc. Once rotated the same
    // "outward" way arc text is, the apex should instead point directly away from the arc's
    // own center -- landing on the same ray as the nob itself.
    const apexUpTriangleSvg = '<svg><path d="M0 20L20 20L10 0Z"/></svg>';
    const loadTriangleIcon: LoadIconSource = async (iconId) => ({
      svgSource: apexUpTriangleSvg,
      resolvedId: iconId,
      substituted: false,
    });
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 15,
      ribbonLengthMm: 32,
      nobDiameterMm: 24,
    };

    const result = await computeReliefComponents(
      arcSpec({ shape, icons: [{ iconId: "triangle", side: "left", scale: 0.7 }] }),
      font,
      printProfile,
      loadTriangleIcon,
    );

    const [iconComponent] = result.reliefComponents;
    const { left } = computeNobPlacements(shape, CENTER_ANGLE_DEG);

    // The apex is the contour vertex closest to the nob center: the two base corners sit a
    // factor of sqrt(2) farther out from the center than the apex does, a relationship
    // rotation preserves regardless of the nob's angle.
    const [nobCenterX, nobCenterY] = left.position;
    const apex = iconComponent.contours[0].reduce((closest, point) => {
      const distance = Math.hypot(point[0] - nobCenterX, point[1] - nobCenterY);
      const closestDistance = Math.hypot(closest[0] - nobCenterX, closest[1] - nobCenterY);

      return distance < closestDistance ? point : closest;
    });

    const apexAngleDeg = Math.atan2(apex[1], apex[0]) * (180 / Math.PI);

    expect(apexAngleDeg).toBeCloseTo(left.angleDeg, 1);
  });

  it("offsets a second arc line to a smaller radius than the first", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      arcSpec({
        shape: { type: "arc", ribbonWidthMm: 22, ribbonLengthMm: 40, nobDiameterMm: 44 },
        lines: [
          { text: "Commanding Aura", sizeMm: 7 },
          { text: "Aura +1 TAC +1 DMG", sizeMm: 4.5 },
        ],
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    // 2 nob icons + 2 lines, each line fitting on a single arc row.
    expect(result.reliefComponents).toHaveLength(4);

    const [, , firstLine, secondLine] = result.reliefComponents;
    const radialMin = (contours: [number, number][][]) =>
      Math.min(...contours.flat().map(([x, y]) => Math.hypot(x, y)));

    // The first line's baseline radius sits further out than the second's; the visible gap
    // between them (approved by the user in the browser) comes from computeLineRadiiMm's
    // fixed TWO_LINE_GAP_MM, not from a strict non-overlap guarantee on every glyph's bbox.
    expect(radialMin(firstLine.contours)).toBeGreaterThan(radialMin(secondLine.contours));
  });

  it("balances the margin above the first line and below the second line against the ribbon edges", async () => {
    const font = loadTestFont();
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 22,
      ribbonLengthMm: 40,
      nobDiameterMm: 44,
    };

    const result = await computeReliefComponents(
      arcSpec({
        shape,
        lines: [
          { text: "Commanding Aura", sizeMm: 7 },
          { text: "Aura +1 TAC +1 DMG", sizeMm: 4.5 },
        ],
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    const [, , firstLine, secondLine] = result.reliefComponents;
    const radialExtent = (contours: [number, number][][]) => {
      const radii = contours.flat().map(([x, y]) => Math.hypot(x, y));
      return { min: Math.min(...radii), max: Math.max(...radii) };
    };

    const outerMarginMm = computeOuterRadiusMm(shape) - radialExtent(firstLine.contours).max;
    const innerMarginMm = radialExtent(secondLine.contours).min - computeInnerRadiusMm();

    expect(outerMarginMm).toBeGreaterThan(3);
    expect(innerMarginMm).toBeGreaterThan(3);
    expect(Math.abs(outerMarginMm - innerMarginMm)).toBeLessThan(1);
  });

  it("vertically centers a single arc line within the ribbon band", async () => {
    const font = loadTestFont();
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 22,
      ribbonLengthMm: 40,
      nobDiameterMm: 44,
    };

    const result = await computeReliefComponents(
      arcSpec({ shape, lines: [{ text: "Momentum", sizeMm: 7 }] }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    const [, , line] = result.reliefComponents;
    const radii = line.contours.flat().map(([x, y]) => Math.hypot(x, y));
    const innerMarginMm = Math.min(...radii) - computeInnerRadiusMm();
    const outerMarginMm = computeOuterRadiusMm(shape) - Math.max(...radii);

    expect(innerMarginMm).toBeGreaterThan(3);
    expect(Math.abs(outerMarginMm - innerMarginMm)).toBeLessThan(1);
  });

  it("keeps a single line centered in the band even after autoFitLine shrinks it below its nominal size", async () => {
    const font = loadTestFont();
    // A tight band (6mm) on a small radius: "Momentum" at its nominal 5mm doesn't fit the
    // available arc length, so autoFitLine shrinks the rendered size well below 5mm. The
    // line must stay centered for the size it actually renders at, not the nominal one.
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      nobDiameterMm: 12,
    };

    const result = await computeReliefComponents(
      arcSpec({ shape, lines: [{ text: "Momentum", sizeMm: 5 }] }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    const [, , line] = result.reliefComponents;
    const radii = line.contours.flat().map(([x, y]) => Math.hypot(x, y));
    const innerMarginMm = Math.min(...radii) - computeInnerRadiusMm();
    const outerMarginMm = computeOuterRadiusMm(shape) - Math.max(...radii);

    expect(innerMarginMm).toBeGreaterThan(0);
    expect(outerMarginMm).toBeGreaterThan(0);
    expect(Math.abs(outerMarginMm - innerMarginMm)).toBeLessThan(0.5);
  });

  it("warns when a line gets truncated to fit", async () => {
    const font = loadTestFont();
    const longText =
      "This line of text is so extremely long that it cannot possibly fit on this arc " +
      "even after being split into two lines at the middle whitespace no matter what";

    const result = await computeReliefComponents(
      arcSpec({
        lines: [{ text: longText, sizeMm: 6 }],
        fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: true },
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    expect(result.warnings.some((warning) => warning.includes("truncated"))).toBe(true);
  });

  it("tags each relief component with its own origin (text, icon, or decoration)", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({ lines: [{ text: "12", sizeMm: 5 }] }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    const sources = result.reliefComponents.map((component) => component.source);

    expect(sources).toContainEqual({ kind: "icon", iconId: "ball" });
    expect(sources).toContainEqual({ kind: "text", text: "12" });
  });

  it("is valid with no component failures when every detail is thick enough to print", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({ icons: [], lines: [{ text: "12", sizeMm: 8 }] }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    expect(result.valid).toBe(true);
    expect(result.componentFailures).toEqual([]);
  });

  it("names the specific text line that failed the min-stroke-width check, not just a total count", async () => {
    const font = loadTestFont();

    // fdm-04's minStrokeWidthMm is 0.45mm; a hairline-small line renders well below that.
    const result = await computeReliefComponents(
      discSpec({ icons: [], lines: [{ text: "l", sizeMm: 0.3 }] }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    const [failure] = result.componentFailures;

    expect(result.valid).toBe(false);
    expect(result.componentFailures).toHaveLength(1);
    expect(failure.source).toEqual({ kind: "text", text: "l" });
    expect(failure.kind).toBe("stroke-width");

    if (failure.kind === "stroke-width") {
      expect(failure.vanishedFeatureCount).toBeGreaterThan(0);
    }
  });

  it("flags an icon as needing attention when its own artwork overflows its target circle", async () => {
    const font = loadTestFont();
    // A solid square: its own corners are its farthest points from center, past the circle
    // inscribed in its bounding box, at any scale (see iconPlacement.test.ts).
    const squareIconSvg = '<svg><path d="M0 0L10 0L10 10L0 10Z"/></svg>';
    const loadSquareIcon: LoadIconSource = async (iconId) => ({
      svgSource: squareIconSvg,
      resolvedId: iconId,
      substituted: false,
    });

    const result = await computeReliefComponents(
      discSpec({ icons: [{ iconId: "cooks", side: "center", scale: 0.7 }], lines: [] }),
      font,
      printProfile,
      loadSquareIcon,
    );

    expect(result.valid).toBe(false);
    expect(result.componentFailures).toEqual([
      { kind: "icon-overflow", source: { kind: "icon", iconId: "cooks" } },
    ]);
  });

  it("keeps a chunky icon out of the failures list even when a hairline text line beside it fails", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({
        icons: [{ iconId: "ball", side: "center", scale: 0.7 }],
        lines: [{ text: "l", sizeMm: 0.3 }],
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    expect(result.valid).toBe(false);
    expect(result.componentFailures).toHaveLength(1);
    expect(result.componentFailures[0].source).toEqual({ kind: "text", text: "l" });
  });

  const ringSpec = (overrides: Partial<TokenSpec> = {}): TokenSpec => ({
    version: 1,
    shape: { type: "disc", diameterMm: 20 },
    textLayout: "ring",
    lines: [
      { text: "Goal", sizeMm: 3, radiusMm: 9 },
      { text: "Influence", sizeMm: 3, radiusMm: 9 },
    ],
    icons: [{ iconId: "ball", side: "center", scale: 0.7 }],
    decorations: [{ type: "ring", radiusMm: 9.5, widthMm: 0.6 }],
    style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
    colorGroups: [],
    printProfileId: "fdm-04",
    fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: false },
    ...overrides,
  });

  it("builds relief components for the center icon, both ring text lines, and the ring decoration together", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      ringSpec(),
      font,
      printProfile,
      stubLoadIconSource,
    );

    expect(result.reliefComponents).toHaveLength(4); // 1 icon + 2 lines + 1 ring decoration
    expect(result.warnings).toEqual([]);
  });

  it("throws when a ring text line has no explicit radiusMm", async () => {
    const font = loadTestFont();

    await expect(
      computeReliefComponents(
        ringSpec({ lines: [{ text: "Goal", sizeMm: 3 }] }),
        font,
        printProfile,
        stubLoadIconSource,
      ),
    ).rejects.toThrow(/radiusMm/);
  });

  it("lays out the first line outward along the top and the second line inward along the bottom", async () => {
    const font = loadTestFont();
    const radialExtent = (contours: [number, number][][]) => {
      const distances = contours.flat().map(([x, y]) => Math.hypot(x, y));
      return { min: Math.min(...distances), max: Math.max(...distances) };
    };

    const result = await computeReliefComponents(
      ringSpec({
        icons: [],
        decorations: [],
        lines: [
          { text: "L", sizeMm: 3, radiusMm: 9 },
          { text: "L", sizeMm: 3, radiusMm: 9 },
        ],
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    const [topLine, bottomLine] = result.reliefComponents;

    // Top line (outward): its ascender grows past its own 9mm radius.
    expect(radialExtent(topLine.contours).max).toBeGreaterThan(9);
    // Bottom line (inward): its ascender grows inward, below its own 9mm radius.
    expect(radialExtent(bottomLine.contours).min).toBeLessThan(9);
  });
});
