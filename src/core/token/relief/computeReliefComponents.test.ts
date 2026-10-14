import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

import { buildCharacterTokenSpec } from "../catalog/token-items/characterTokenSpec";
import { DEFAULT_SHARED_CONFIG } from "../catalog/token-items/defaultSharedConfig";
import { CENTER_ANGLE_DEG } from "../geometry/angleConventions";
import {
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeStudPlacements,
} from "../geometry/studPlacement";
import { PRINT_PROFILES } from "../printProfiles";
import { loadTestFont } from "../text/testFont";
import { TokenSpec } from "../types";
import { computeReliefComponents, LoadIconSource } from "./computeReliefComponents";

// A diamond whose vertices sit exactly on its own bounding box's inscribed circle (see
// iconPlacement.test.ts's identical fixture): fits within a circular stud/disc with no shrink, so
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
  // 120 degrees of arc, measured on the fixed inner radius.
  shape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 32, studDiameterMm: 24 },
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

  it("builds relief components for both stud icons and every line on an arc shape", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(arcSpec(), font, printProfile, stubLoadIconSource);

    expect(result.reliefComponents).toHaveLength(3); // 2 stud icons + 1 line (fits on one line here)
    expect(result.warnings).toEqual([]);
  });

  it("rotates a stud icon so it turns with the arc the same way the letters beside it do", async () => {
    const font = loadTestFont();
    // Placed, the triangle's apex points along +y. Rotated outward like arc text, it should point
    // away from the arc's center, on the same ray as its stud.
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
      studDiameterMm: 24,
    };

    const result = await computeReliefComponents(
      arcSpec({ shape, icons: [{ iconId: "triangle", side: "left", scale: 0.7 }] }),
      font,
      printProfile,
      loadTriangleIcon,
    );

    const [iconComponent] = result.reliefComponents;
    const { left } = computeStudPlacements(shape, CENTER_ANGLE_DEG);

    // The apex is the contour vertex closest to the stud center: the two base corners sit a
    // factor of sqrt(2) farther out from the center than the apex does, a relationship
    // rotation preserves regardless of the stud's angle.
    const [studCenterX, studCenterY] = left.position;
    const apex = iconComponent.contours[0].reduce((closest, point) => {
      const distance = Math.hypot(point[0] - studCenterX, point[1] - studCenterY);
      const closestDistance = Math.hypot(closest[0] - studCenterX, closest[1] - studCenterY);

      return distance < closestDistance ? point : closest;
    });

    const apexAngleDeg = Math.atan2(apex[1], apex[0]) * (180 / Math.PI);

    expect(apexAngleDeg).toBeCloseTo(left.angleDeg, 1);
  });

  it("offsets a second arc line to a smaller radius than the first", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      arcSpec({
        shape: { type: "arc", ribbonWidthMm: 22, ribbonLengthMm: 40, studDiameterMm: 44 },
        lines: [
          { text: "Commanding Aura", sizeMm: 7 },
          { text: "Aura +1 TAC +1 DMG", sizeMm: 4.5 },
        ],
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    // 2 stud icons + 2 lines, each line fitting on a single arc row.
    expect(result.reliefComponents).toHaveLength(4);

    const [, , firstLine, secondLine] = result.reliefComponents;
    const radialMin = (contours: [number, number][][]) =>
      Math.min(...contours.flat().map(([x, y]) => Math.hypot(x, y)));

    // The gap comes from TWO_LINE_GAP_MM, not from checking every glyph's box for overlap.
    expect(radialMin(firstLine.contours)).toBeGreaterThan(radialMin(secondLine.contours));
  });

  it("balances the margin above the first line and below the second line against the ribbon edges", async () => {
    const font = loadTestFont();
    const shape = {
      type: "arc" as const,
      ribbonWidthMm: 22,
      ribbonLengthMm: 40,
      studDiameterMm: 44,
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
      studDiameterMm: 44,
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
      studDiameterMm: 12,
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
    expect(failure).toMatchObject({ kind: "stroke-width", source: { kind: "text", text: "l" } });
    expect(result.blocksExport).toBe(true);

    if (failure.kind === "stroke-width") {
      expect(failure.vanishedFeatureCount).toBeGreaterThan(0);
    }
  });

  // A square's corners reach past its inscribed circle, so at scale 0.9 it overflows.
  const squareIconSvg = '<svg><path d="M0 0L10 0L10 10L0 10Z"/></svg>';
  const loadSquareIcon: LoadIconSource = async (iconId) => ({
    svgSource: squareIconSvg,
    resolvedId: iconId,
    substituted: false,
  });

  it("flags an icon as needing attention when its own artwork overflows its target circle and overflowBehavior is 'none' (the default)", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({ icons: [{ iconId: "cooks", side: "center", scale: 0.9 }], lines: [] }),
      font,
      printProfile,
      loadSquareIcon,
    );

    expect(result.valid).toBe(false);
    expect(result.componentFailures).toEqual([
      { kind: "icon-overflow", source: { kind: "icon", iconId: "cooks" } },
    ]);
  });

  it("shrinks the icon and raises no icon-overflow failure when overflowBehavior is 'shrink'", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({
        icons: [{ iconId: "cooks", side: "center", scale: 0.9, overflowBehavior: "shrink" }],
        lines: [],
      }),
      font,
      printProfile,
      loadSquareIcon,
    );

    expect(result.valid).toBe(true);
    expect(result.componentFailures).toEqual([]);

    const [icon] = result.reliefComponents;
    const maxRadius = Math.max(...icon.contours.flat().map(([x, y]) => Math.hypot(x, y)));
    // discSpec's diameter is 25mm: the real target circle's radius, regardless of icon.scale.
    expect(maxRadius).toBeLessThanOrEqual(25 / 2 + 1e-6);
  });

  it("trims the icon and raises no icon-overflow failure when overflowBehavior is 'trim'", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({
        icons: [{ iconId: "cooks", side: "center", scale: 0.9, overflowBehavior: "trim" }],
        lines: [],
      }),
      font,
      printProfile,
      loadSquareIcon,
    );

    expect(result.valid).toBe(true);
    expect(result.componentFailures).toEqual([]);

    const [icon] = result.reliefComponents;
    const maxRadius = Math.max(...icon.contours.flat().map(([x, y]) => Math.hypot(x, y)));
    expect(maxRadius).toBeLessThanOrEqual(25 / 2 + 1e-6);
  });

  it("leaves the icon's own contours untouched and raises no icon-overflow failure when overflowBehavior is 'grow'", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({
        icons: [{ iconId: "cooks", side: "center", scale: 0.9, overflowBehavior: "grow" }],
        lines: [],
      }),
      font,
      printProfile,
      loadSquareIcon,
    );

    expect(result.valid).toBe(true);
    expect(result.componentFailures).toEqual([]);

    const [icon] = result.reliefComponents;
    const maxRadius = Math.max(...icon.contours.flat().map(([x, y]) => Math.hypot(x, y)));
    // Unlike 'shrink' and 'trim', 'grow' never touches the icon's own footprint: it stays
    // past the target circle's radius (discSpec's diameter is 25mm).
    expect(maxRadius).toBeGreaterThan(25 / 2);
    expect(icon.growOutline).toBeDefined();
    expect(icon.growOutline?.length).toBeGreaterThan(0);
  });

  it("does not set growOutline on an icon that never overflows its target circle, even with overflowBehavior 'grow'", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      discSpec({
        icons: [{ iconId: "ball", side: "center", scale: 0.7, overflowBehavior: "grow" }],
        lines: [],
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    const [icon] = result.reliefComponents;
    expect(icon.growOutline).toBeUndefined();
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
    expect(result.componentFailures[0]).toMatchObject({ source: { kind: "text", text: "l" } });
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

  it("centers a ring line on its own centerAngleDeg, reading inward in the lower half", async () => {
    const font = loadTestFont();
    const lowerRightAngleDeg = 330;
    const angleToleranceDeg = 5;

    const result = await computeReliefComponents(
      ringSpec({
        icons: [],
        decorations: [],
        lines: [{ text: "LL", sizeMm: 3, radiusMm: 9, centerAngleDeg: lowerRightAngleDeg }],
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    const points = result.reliefComponents[0].contours.flat();
    const meanX = points.reduce((sum, [x]) => sum + x, 0) / points.length;
    const meanY = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
    const centroidAngleDeg = (Math.atan2(meanY, meanX) * 180) / Math.PI + 360;
    const distances = points.map(([x, y]) => Math.hypot(x, y));

    expect(Math.abs(centroidAngleDeg - lowerRightAngleDeg)).toBeLessThan(angleToleranceDeg);
    // Inward: its ascender grows below its own 9mm radius.
    expect(Math.min(...distances)).toBeLessThan(9);
  });

  it("lays out every ring line that names its own angle, not just the first two", async () => {
    const font = loadTestFont();

    const result = await computeReliefComponents(
      ringSpec({
        icons: [],
        decorations: [],
        lines: [
          { text: "A", sizeMm: 3, radiusMm: 9, centerAngleDeg: 90 },
          { text: "B", sizeMm: 3, radiusMm: 9, centerAngleDeg: 210 },
          { text: "C", sizeMm: 3, radiusMm: 9, centerAngleDeg: 330 },
        ],
      }),
      font,
      printProfile,
      stubLoadIconSource,
    );

    expect(result.reliefComponents).toHaveLength(3);
  });

  it("lays a radial ring line straight along its spoke, centered at its radius", async () => {
    const font = loadTestFont();
    const radiusMm = 15;
    const centerToleranceMm = 0.5;
    const placements = [
      { angleDeg: 90, expectedCenter: [0, radiusMm] },
      { angleDeg: 210, expectedCenter: [-radiusMm * Math.cos(Math.PI / 6), -radiusMm / 2] },
    ];

    for (const { angleDeg, expectedCenter } of placements) {
      const result = await computeReliefComponents(
        ringSpec({
          icons: [],
          decorations: [],
          lines: [
            {
              text: "LLLLLL",
              sizeMm: 3,
              radiusMm,
              centerAngleDeg: angleDeg,
              placement: "radial",
            },
          ],
        }),
        font,
        printProfile,
        stubLoadIconSource,
      );

      const points = result.reliefComponents[0].contours.flat();
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      const spokeDirection = [
        Math.cos((angleDeg * Math.PI) / 180),
        Math.sin((angleDeg * Math.PI) / 180),
      ];
      const alongSpoke = points.map(([x, y]) => x * spokeDirection[0] + y * spokeDirection[1]);
      const acrossSpoke = points.map(([x, y]) => -x * spokeDirection[1] + y * spokeDirection[0]);
      const lengthAlong = Math.max(...alongSpoke) - Math.min(...alongSpoke);
      const lengthAcross = Math.max(...acrossSpoke) - Math.min(...acrossSpoke);

      expect(Math.abs(centerX - expectedCenter[0])).toBeLessThan(centerToleranceMm);
      expect(Math.abs(centerY - expectedCenter[1])).toBeLessThan(centerToleranceMm);
      expect(lengthAlong).toBeGreaterThan(lengthAcross);
    }
  });

  it("throws when a ring line past the second has no centerAngleDeg", async () => {
    const font = loadTestFont();

    await expect(
      computeReliefComponents(
        ringSpec({
          lines: [
            { text: "A", sizeMm: 3, radiusMm: 9 },
            { text: "B", sizeMm: 3, radiusMm: 9 },
            { text: "C", sizeMm: 3, radiusMm: 9 },
          ],
        }),
        font,
        printProfile,
        stubLoadIconSource,
      ),
    ).rejects.toThrow(/centerAngleDeg/);
  });
});

describe("computeReliefComponents, layout checks", () => {
  const LAYOUT_FAILURE_KINDS = ["outside-footprint", "crest-over-text", "broken-footprint"];

  it("flags ring text that runs past the disc's rim", async () => {
    const font = loadTestFont();
    const spec = discSpec({
      textLayout: "ring",
      icons: [],
      lines: [{ text: "TOO FAR", sizeMm: 4, radiusMm: 12 }],
    });

    const result = await computeReliefComponents(spec, font, printProfile, stubLoadIconSource);

    expect(result.valid).toBe(false);
    expect(result.blocksExport).toBe(false);
    expect(result.componentFailures.map((failure) => failure.kind)).toContain("outside-footprint");
  });

  it("adds no layout failure to a token whose text and icon fit", async () => {
    const font = loadTestFont();
    const spec = discSpec({
      textLayout: "ring",
      icons: [{ iconId: "ball", side: "center", scale: 0.4 }],
      lines: [{ text: "FITS", sizeMm: 2, radiusMm: 9 }],
    });

    const result = await computeReliefComponents(spec, font, printProfile, stubLoadIconSource);
    const layoutFailures = result.componentFailures.filter((failure) =>
      LAYOUT_FAILURE_KINDS.includes(failure.kind),
    );

    expect(layoutFailures).toEqual([]);
  });
});

describe("computeReliefComponents, arc text against a real crest", () => {
  // The real Brewers crest and the default settings, where these long names used to run into
  // the crest on one line.
  const crestSvg = readFileSync("public/icons/guilds/Brewers/logo.svg", "utf8");
  const loadCrest: LoadIconSource = async (iconId) => ({
    svgSource: crestSvg,
    resolvedId: iconId,
    substituted: false,
  });
  const defaultProfile = PRINT_PROFILES[DEFAULT_SHARED_CONFIG.printProfileId];

  it.each([
    "Unpredictable Movement",
    "Take One for the Team",
    "Fangtooth Unleashed",
    "Blessing of the Moon Goddess",
  ])("shrinks %s to fit between the crests", async (name) => {
    const spec = buildCharacterTokenSpec({ id: "x", name }, "Brewers", 1, DEFAULT_SHARED_CONFIG);

    const result = await computeReliefComponents(spec, loadTestFont(), defaultProfile, loadCrest);
    const failureKinds = result.componentFailures.map((failure) => failure.kind);

    expect(failureKinds).not.toContain("crest-over-text");
  });
});
