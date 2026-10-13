import type { Font } from "opentype.js";

import { DEGREES_PER_RADIAN } from "../geometry/angleConventions";
import { rotateContours, translateContours } from "../geometry/contourTransforms";
import { ReliefComponent } from "../mesh/reliefComponent";
import { layoutArcText } from "../text/layoutArcText";
import { layoutFlatText } from "../text/layoutFlatText";
import { computeRadialTextRotationDeg } from "../text/radialTextRotation";
import { LineSpec, PrintProfile, TokenSpec, Vec2 } from "../types";
import {
  buildCenterIconComponents,
  buildDecorationComponents,
  LoadIconSource,
  requireDiscShape,
} from "./computeReliefComponentsShared";

// The ring layout's two text bands: top (outward-reading, same convention as the ribbon arc)
// and bottom (inward-reading, so it stays upright for a viewer who never rotates the token --
// see arcPlacement.ts's ArcOrientation doc comment).
const RING_TOP_CENTER_ANGLE_DEG = 90;
const RING_BOTTOM_CENTER_ANGLE_DEG = 270;
const DEFAULT_CENTER_ANGLES_DEG = [RING_TOP_CENTER_ANGLE_DEG, RING_BOTTOM_CENTER_ANGLE_DEG];
const HALF_TURN_DEG = 180;
const FULL_TURN_DEG = 360;

const resolveCenterAngleDeg = (line: LineSpec, index: number): number => {
  const centerAngleDeg = line.centerAngleDeg ?? DEFAULT_CENTER_ANGLES_DEG[index];

  if (centerAngleDeg === undefined) {
    throw new Error(
      `Ring text line "${line.text}" needs a centerAngleDeg: only the first two lines default to top and bottom.`,
    );
  }

  return centerAngleDeg;
};

// A line in the lower half reads inward, like the bottom line, so it stays upright for the same
// viewer as the top one.
const resolveOrientation = (centerAngleDeg: number): "outward" | "inward" => {
  const normalizedAngleDeg = ((centerAngleDeg % FULL_TURN_DEG) + FULL_TURN_DEG) % FULL_TURN_DEG;
  const isLowerHalf = normalizedAngleDeg > HALF_TURN_DEG;

  return isLowerHalf ? "inward" : "outward";
};

const layoutCurvedLine = (
  font: Font,
  line: LineSpec,
  radiusMm: number,
  centerAngleDeg: number,
  toleranceMm: number,
): Vec2[][] => {
  return layoutArcText(
    font,
    {
      text: line.text,
      sizeMm: line.sizeMm,
      radiusMm,
      centerAngleDeg,
      orientation: resolveOrientation(centerAngleDeg),
    },
    toleranceMm,
    "mathYUp",
  );
};

// Straight text along a spoke: laid flat around its own center, turned so its baseline runs along
// the spoke (never upside down), then moved radiusMm out along it.
const layoutRadialLine = (
  font: Font,
  line: LineSpec,
  radiusMm: number,
  centerAngleDeg: number,
  toleranceMm: number,
): Vec2[][] => {
  const flatContours = layoutFlatText(font, { text: line.text, sizeMm: line.sizeMm }, toleranceMm);
  const rotatedContours = rotateContours(
    flatContours,
    computeRadialTextRotationDeg(centerAngleDeg),
  );
  const centerAngleRad = centerAngleDeg / DEGREES_PER_RADIAN;
  const center: Vec2 = [Math.cos(centerAngleRad) * radiusMm, Math.sin(centerAngleRad) * radiusMm];

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
      : layoutCurvedLine(font, line, line.radiusMm, centerAngleDeg, toleranceMm);

  return {
    contours,
    colorGroup: line.colorGroup,
    source: { kind: "text", text: line.text },
  };
};

// A full disc with curved text bands (by default the first on top reading outward and the second
// on the bottom reading inward -- see the RING_*_CENTER_ANGLE_DEG constants above; any line can
// name its own centerAngleDeg instead, or run straight along a spoke with placement "radial"), a
// center icon, and ring/border decorations.
// Unlike the ribbon arc's lines, ring lines have no dynamic auto-centering: the disc has no
// content-driven band to center within, so each line's radiusMm is the caller's own explicit
// choice (see catalog/tokenItems/ringTokenSpec.ts).
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

    return buildRingLineComponent(font, line, centerAngleDeg, printProfile.bezierToleranceMm);
  });

  const decorationComponents = buildDecorationComponents(spec.decorations);

  return [...iconComponents, ...lineComponents, ...decorationComponents];
};
