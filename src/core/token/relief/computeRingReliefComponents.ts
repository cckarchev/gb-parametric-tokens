import type { Font } from "opentype.js";

import { DEGREES_PER_RADIAN } from "../geometry/angleConventions";
import {
  rotateContours,
  translateContours,
} from "../geometry/contourTransforms";
import type { ReliefComponent } from "../mesh/reliefComponent";
import { layoutArcText } from "../text/layoutArcText";
import { layoutFlatText } from "../text/layoutFlatText";
import { computeRadialTextRotationDeg } from "../text/radialTextRotation";
import { resolveRingLineOrientation } from "../text/ringLineOrientation";
import type { LineSpec, PrintProfile, TokenSpec, Vec2 } from "../types";
import {
  buildCenterIconComponents,
  buildDecorationComponents,
  type LoadIconSource,
  requireDiscShape,
} from "./computeReliefComponentsShared";

// The ring layout's two text bands: top (outward-reading, same convention as the ribbon arc)
// and bottom (inward-reading, so it stays upright for a viewer who never rotates the token,
// see arcPlacement.ts's ArcOrientation doc comment).
const RING_TOP_CENTER_ANGLE_DEG = 90;
const RING_BOTTOM_CENTER_ANGLE_DEG = 270;
const DEFAULT_CENTER_ANGLES_DEG = [
  RING_TOP_CENTER_ANGLE_DEG,
  RING_BOTTOM_CENTER_ANGLE_DEG,
];

const resolveCenterAngleDeg = (line: LineSpec, index: number): number => {
  const centerAngleDeg =
    line.centerAngleDeg ?? DEFAULT_CENTER_ANGLES_DEG[index];

  if (centerAngleDeg === undefined) {
    throw new Error(
      `Ring text line "${line.text}" needs a centerAngleDeg: only the first two lines default to top and bottom.`,
    );
  }

  return centerAngleDeg;
};

const layoutCurvedLine = (
  font: Font,
  line: LineSpec,
  radiusMm: number,
  centerAngleDeg: number,
  toleranceMm: number,
): Vec2[][] =>
  layoutArcText(
    font,
    {
      text: line.text,
      sizeMm: line.sizeMm,
      radiusMm,
      centerAngleDeg,
      orientation: resolveRingLineOrientation(centerAngleDeg),
    },
    toleranceMm,
    "mathYUp",
  );

// Straight text along a spoke: laid flat around its own center, turned so its baseline runs along
// the spoke (never upside down), then moved radiusMm out along it.
const layoutRadialLine = (
  font: Font,
  line: LineSpec,
  radiusMm: number,
  centerAngleDeg: number,
  toleranceMm: number,
): Vec2[][] => {
  const flatContours = layoutFlatText(
    font,
    { text: line.text, sizeMm: line.sizeMm },
    toleranceMm,
  );
  const rotatedContours = rotateContours(
    flatContours,
    computeRadialTextRotationDeg(centerAngleDeg),
  );
  const centerAngleRad = centerAngleDeg / DEGREES_PER_RADIAN;
  const center: Vec2 = [
    Math.cos(centerAngleRad) * radiusMm,
    Math.sin(centerAngleRad) * radiusMm,
  ];

  return translateContours(rotatedContours, center);
};

const buildRingLineComponent = (
  font: Font,
  line: LineSpec,
  centerAngleDeg: number,
  toleranceMm: number,
): ReliefComponent => {
  if (line.radiusMm === undefined) {
    throw new Error('A "ring" text line requires an explicit radiusMm.');
  }

  const contours =
    line.placement === "radial"
      ? layoutRadialLine(font, line, line.radiusMm, centerAngleDeg, toleranceMm)
      : layoutCurvedLine(
          font,
          line,
          line.radiusMm,
          centerAngleDeg,
          toleranceMm,
        );

  return {
    contours,
    colorGroup: line.colorGroup,
    source: { kind: "text", text: line.text },
  };
};

// A disc with curved text, a center icon and ring decorations. By default the first line runs
// along the top and the second along the bottom; a line can set its own centerAngleDeg, or run
// along a spoke with placement "radial".
//
// Each line's radiusMm comes from the caller. Unlike the ribbon, nothing here centers it.
export const computeRingReliefComponents = async (
  spec: TokenSpec,
  font: Font,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
): Promise<ReliefComponent[]> => {
  const shape = requireDiscShape(spec, "computeRingReliefComponents");
  const targetDiameterMm = shape.diameterMm;
  const iconComponents = await buildCenterIconComponents(
    spec.icons,
    targetDiameterMm,
    printProfile,
    loadIconSource,
    warnings,
  );

  const lineComponents = spec.lines.map((line, index) => {
    const centerAngleDeg = resolveCenterAngleDeg(line, index);

    return buildRingLineComponent(
      font,
      line,
      centerAngleDeg,
      printProfile.bezierToleranceMm,
    );
  });

  const decorationComponents = buildDecorationComponents(spec.decorations);

  return [...iconComponents, ...lineComponents, ...decorationComponents];
};
