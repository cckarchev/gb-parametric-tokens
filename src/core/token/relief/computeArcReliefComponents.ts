import type { Font } from "opentype.js";

import { CENTER_ANGLE_DEG, RADIAL_TO_UPRIGHT_OFFSET_DEG } from "../geometry/angleConventions";
import {
  computeEffectiveStudDiameterMm,
  computeInnerRadiusMm,
  computeOuterRadiusMm,
  computeStudPlacements,
  computeSweepDeg,
} from "../geometry/studPlacement";
import { ReliefComponent } from "../mesh/reliefComponent";
import { autoFitLine } from "../text/autoFit";
import { estimateAscentMm } from "../text/glyphMetrics";
import { layoutArcText } from "../text/layoutArcText";
import { PrintProfile, TokenSpec } from "../types";
import { buildIconComponent, LoadIconSource } from "./computeReliefComponentsShared";

const STUD_TEXT_CLEARANCE_DEG = 6;

// An absolute mm gap, not proportional to the ribbon band width, so it only makes sense
// relative to the app's own default arc shape (see defaultShapeAndStyle.ts's DEFAULT_ARC_SHAPE /
// Frozen Forge measurements). Remeasure via the real pipeline if the default shape's band width
// changes significantly again.
const TWO_LINE_GAP_MM = 0.5;

// The arc's line position is fixed by line count, not user-editable (spec.lines is capped at
// 2 by the UI). Arc text has no descender in this all-caps use case, so a line's rendered
// extent runs from its baseline radius outward by its own ascent only, never inward. A single
// line is centered so its ascent splits evenly above and below the mid radius; two lines are
// stacked with a fixed gap between them and the two leftover margins (inner edge to the
// second line, first line to the outer edge) split evenly, so neither margin reads as
// lopsided against the ribbon edges.
const computeLineRadiiMm = (
  innerRadiusMm: number,
  outerRadiusMm: number,
  lines: { sizeMm: number }[],
): number[] => {
  const midRadiusMm = (innerRadiusMm + outerRadiusMm) / 2;

  if (lines.length !== 2) {
    return lines.map(({ sizeMm }) => midRadiusMm - estimateAscentMm(sizeMm) / 2);
  }

  const [nameLine, effectLine] = lines;
  const nameAscentMm = estimateAscentMm(nameLine.sizeMm);
  const effectAscentMm = estimateAscentMm(effectLine.sizeMm);
  const bandWidthMm = outerRadiusMm - innerRadiusMm;
  const marginMm = (bandWidthMm - nameAscentMm - effectAscentMm - TWO_LINE_GAP_MM) / 2;

  const effectRadiusMm = innerRadiusMm + marginMm;
  const nameRadiusMm = effectRadiusMm + effectAscentMm + TWO_LINE_GAP_MM;

  return [nameRadiusMm, effectRadiusMm];
};

export const computeArcReliefComponents = async (
  spec: TokenSpec,
  font: Font,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
): Promise<ReliefComponent[]> => {
  const shape = spec.shape;

  if (shape.type !== "arc") {
    throw new Error("computeArcReliefComponents requires an arc shape");
  }

  const studPlacements = computeStudPlacements(shape, CENTER_ANGLE_DEG);
  const availableSweepDeg = computeSweepDeg(shape) - 2 * STUD_TEXT_CLEARANCE_DEG;
  const ribbonInnerRadiusMm = computeInnerRadiusMm();
  const outerRadiusMm = computeOuterRadiusMm(shape);
  const nominalLineRadiiMm = computeLineRadiiMm(ribbonInnerRadiusMm, outerRadiusMm, spec.lines);

  const iconComponents = await Promise.all(
    spec.icons
      .filter((icon) => icon.side === "left" || icon.side === "right")
      .map((icon) => {
        const studPlacement = icon.side === "left" ? studPlacements.left : studPlacements.right;
        // Same "outward" convention arcPlacement.ts's mathYUpRotationDeg uses for arc text, via
        // the same offset: keeping the stud icons on it makes them turn with the arc exactly like
        // the letters beside them do, instead of staying screen-upright as the stud sweeps around.
        const rotationDeg = studPlacement.angleDeg - RADIAL_TO_UPRIGHT_OFFSET_DEG;

        return buildIconComponent(
          icon,
          computeEffectiveStudDiameterMm(shape),
          studPlacement.position,
          printProfile,
          loadIconSource,
          warnings,
          rotationDeg,
        );
      }),
  );

  const nominalFits = spec.lines.map((line, lineIndex) =>
    autoFitLine(
      font,
      {
        text: line.text,
        sizeMm: line.sizeMm,
        radiusMm: line.radiusMm ?? nominalLineRadiiMm[lineIndex],
        availableSweepDeg,
      },
      spec.fitPolicy,
      printProfile,
    ),
  );

  // autoFitLine can shrink a line's rendered size below its spec.lines[i].sizeMm to make it
  // fit the available arc length. nominalLineRadiiMm above centered every line assuming it
  // would render at its full nominal size, so a shrunk line's real ascent no longer matches
  // what it was centered for and drifts toward the inner edge. Recompute the vertical
  // centering from each line's actual rendered size and re-center it, unless the spec pinned
  // an explicit radiusMm (respect that override) or the line split into multiple rows via
  // autoFitLine's own mid-word wrap (those already carry their own, independent radii).
  const actualLineRadiiMm = computeLineRadiiMm(
    ribbonInnerRadiusMm,
    outerRadiusMm,
    nominalFits.map((fit) => ({ sizeMm: Math.max(...fit.lines.map((l) => l.sizeMm)) })),
  );

  const lineComponents: ReliefComponent[] = spec.lines.map((line, lineIndex) => {
    const nominalFit = nominalFits[lineIndex];
    const shouldRecenter = line.radiusMm === undefined && nominalFit.lines.length === 1;
    const fit = shouldRecenter
      ? {
          ...nominalFit,
          lines: [{ ...nominalFit.lines[0], radiusMm: actualLineRadiiMm[lineIndex] }],
        }
      : nominalFit;

    if (fit.truncated) {
      warnings.push(`Line "${line.text}" was truncated to fit.`);
    }

    const contours = fit.lines.flatMap((outputLine) =>
      layoutArcText(
        font,
        {
          text: outputLine.text,
          sizeMm: outputLine.sizeMm,
          radiusMm: outputLine.radiusMm,
          centerAngleDeg: CENTER_ANGLE_DEG,
          trackingMm: outputLine.trackingMm,
        },
        printProfile.bezierToleranceMm,
        "mathYUp",
      ),
    );

    return { contours, colorGroup: line.colorGroup, source: { kind: "text", text: line.text } };
  });

  return [...iconComponents, ...lineComponents];
};
