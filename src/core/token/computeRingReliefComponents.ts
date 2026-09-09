import type { Font } from "opentype.js";

import {
  buildCenterIconComponents,
  buildDecorationComponents,
  LoadIconSource,
} from "./computeReliefComponentsShared";
import { ReliefComponent } from "./mesh/reliefComponent";
import { layoutArcText } from "./text/layoutArcText";
import { LineSpec, PrintProfile, TokenSpec } from "./types";

// The ring layout's two text bands: top (outward-reading, same convention as the ribbon arc)
// and bottom (inward-reading, so it stays upright for a viewer who never rotates the token --
// see arcPlacement.ts's ArcOrientation doc comment).
const RING_TOP_CENTER_ANGLE_DEG = 90;
const RING_BOTTOM_CENTER_ANGLE_DEG = 270;

const buildRingLineComponent = (
  font: Font,
  line: LineSpec,
  centerAngleDeg: number,
  orientation: "outward" | "inward",
  toleranceMm: number,
): ReliefComponent => {
  if (line.radiusMm === undefined) {
    throw new Error('A "ring" text line requires an explicit radiusMm.');
  }

  return {
    contours: layoutArcText(
      font,
      {
        text: line.text,
        sizeMm: line.sizeMm,
        radiusMm: line.radiusMm,
        centerAngleDeg,
        orientation,
      },
      toleranceMm,
      "mathYUp",
    ),
    colorGroup: line.colorGroup,
    source: { kind: "text", text: line.text },
  };
};

// A full disc with up to two curved text bands (top reading outward, bottom reading inward --
// see the RING_*_CENTER_ANGLE_DEG constants above), a center icon, and ring/border decorations.
// Unlike the ribbon arc's lines, ring lines have no dynamic auto-centering: the disc has no
// content-driven band to center within, so each line's radiusMm is the caller's own explicit
// choice (see catalog/buildTokenItems.ts's Goal Influence token).
export const computeRingReliefComponents = async (
  spec: TokenSpec,
  font: Font,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
): Promise<ReliefComponent[]> => {
  const shape = spec.shape;

  if (shape.type !== "disc") {
    throw new Error("computeRingReliefComponents requires a disc shape");
  }

  const targetDiameterMm = shape.diameterMm;
  const iconComponents = await buildCenterIconComponents(
    spec.icons,
    targetDiameterMm,
    printProfile,
    loadIconSource,
    warnings,
  );

  const [topLine, bottomLine] = spec.lines;
  const lineComponents: ReliefComponent[] = [];

  if (topLine) {
    lineComponents.push(
      buildRingLineComponent(
        font,
        topLine,
        RING_TOP_CENTER_ANGLE_DEG,
        "outward",
        printProfile.bezierToleranceMm,
      ),
    );
  }

  if (bottomLine) {
    lineComponents.push(
      buildRingLineComponent(
        font,
        bottomLine,
        RING_BOTTOM_CENTER_ANGLE_DEG,
        "inward",
        printProfile.bezierToleranceMm,
      ),
    );
  }

  const decorationComponents = buildDecorationComponents(spec.decorations);

  return [...iconComponents, ...lineComponents, ...decorationComponents];
};
