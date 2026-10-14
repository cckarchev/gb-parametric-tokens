import type { Font } from "opentype.js";

import { CENTER_ANGLE_DEG, RADIAL_TO_UPRIGHT_OFFSET_DEG } from "../geometry/angleConventions";
import { computeCrestFreeSweepDeg } from "../geometry/crestFreeSweep";
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
// Gap kept between a line of text and the crest beside it, so a long name shrinks before it
// touches one.
const CREST_TEXT_CLEARANCE_MM = 0.3;

// A fixed gap, not proportional to the band width, tuned for the default arc shape. Remeasure if
// the default band width changes.
const TWO_LINE_GAP_MM = 0.5;

// Baseline radius of each line on the ribbon (one or two lines). The text is all caps, so a line
// takes up its ascent outward from the baseline and nothing inward.
// - One line: centered on the band.
// - Two lines: TWO_LINE_GAP_MM apart, with equal margins to the inner and outer edges.
const computeLineRadiiMm = (
  innerRadiusMm: number,
  outerRadiusMm: number,
  lines: { sizeMm: number }[],
  fontId: string | undefined,
): number[] => {
  const midRadiusMm = (innerRadiusMm + outerRadiusMm) / 2;

  if (lines.length !== 2) {
    return lines.map(({ sizeMm }) => midRadiusMm - estimateAscentMm(sizeMm, fontId) / 2);
  }

  const [nameLine, effectLine] = lines;
  const nameAscentMm = estimateAscentMm(nameLine.sizeMm, fontId);
  const effectAscentMm = estimateAscentMm(effectLine.sizeMm, fontId);
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
  const nominalLineRadiiMm = computeLineRadiiMm(
    ribbonInnerRadiusMm,
    outerRadiusMm,
    spec.lines,
    spec.fontId,
  );

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

  const crestContours = iconComponents.flatMap((component) => component.contours);

  // The stud clearance alone doesn't know how big the crest is: a big crest, or a big line, can
  // still reach into it. So each line is also held to the arc the crests leave free at its own
  // height. A shrunk line re-centers inside its nominal height, so measuring there is enough.
  const nominalFits = spec.lines.map((line, lineIndex) => {
    const lineRadiusMm = line.radiusMm ?? nominalLineRadiiMm[lineIndex];
    const lineTopRadiusMm = lineRadiusMm + estimateAscentMm(line.sizeMm, spec.fontId);
    const crestFreeSweepDeg = computeCrestFreeSweepDeg(
      crestContours,
      CENTER_ANGLE_DEG,
      lineRadiusMm,
      lineTopRadiusMm,
      CREST_TEXT_CLEARANCE_MM,
    );
    const lineSweepDeg = Math.min(availableSweepDeg, crestFreeSweepDeg ?? availableSweepDeg);

    return autoFitLine(
      font,
      {
        text: line.text,
        sizeMm: line.sizeMm,
        fallbackSizeMm: line.fallbackSizeMm,
        radiusMm: lineRadiusMm,
        availableSweepDeg: lineSweepDeg,
      },
      spec.fitPolicy,
      printProfile,
    );
  });

  // autoFitLine may shrink a line, and a shrunk line centered for its nominal size drifts toward
  // the inner edge. Re-center from the sizes actually rendered. Lines with an explicit radiusMm,
  // or that autoFitLine split in two, keep their own radii.
  const actualLineRadiiMm = computeLineRadiiMm(
    ribbonInnerRadiusMm,
    outerRadiusMm,
    nominalFits.map((fit) => ({ sizeMm: Math.max(...fit.lines.map((l) => l.sizeMm)) })),
    spec.fontId,
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
