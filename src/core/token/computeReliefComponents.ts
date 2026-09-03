import type { Font } from "opentype.js";

import { placeIcon, translateContours } from "./geometry/iconPlacement";
import {
  computeEffectiveNobDiameterMm,
  computeInnerRadiusMm,
  computeNobPlacements,
  computeOuterRadiusMm,
  computeSweepDeg,
} from "./geometry/nobPlacement";
import { computeRingContour } from "./geometry/ringContour";
import { ReliefComponent } from "./mesh/reliefComponent";
import { extractPathData } from "./svg/extractPathData";
import { flattenPath } from "./svg/flattenPath";
import { normalizeWinding } from "./svg/normalizeWinding";
import { parsePathData } from "./svg/parsePathData";
import { autoFitLine } from "./text/autoFit";
import { layoutArcText } from "./text/layoutArcText";
import { layoutFlatText } from "./text/layoutFlatText";
import { IconSpec, LineSpec, PrintProfile, TokenSpec, Vec2 } from "./types";
import {
  MinStrokeWidthValidation,
  validateMinStrokeWidth,
} from "./validation/validateMinStrokeWidth";

const CENTER_ANGLE_DEG = 90;
const NOB_TEXT_CLEARANCE_DEG = 6;
// The ring layout's two text bands: top (outward-reading, same convention as the ribbon arc)
// and bottom (inward-reading, so it stays upright for a viewer who never rotates the token --
// see arcPlacement.ts's ArcOrientation doc comment).
const RING_TOP_CENTER_ANGLE_DEG = 90;
const RING_BOTTOM_CENTER_ANGLE_DEG = 270;

export type LoadIconSourceResult = { svgSource: string; resolvedId: string; substituted: boolean };
export type LoadIconSource = (iconId: string) => Promise<LoadIconSourceResult>;

export type ComputeReliefComponentsResult = {
  reliefComponents: ReliefComponent[];
  validation: MinStrokeWidthValidation;
  warnings: string[];
};

const buildIconComponent = async (
  icon: IconSpec,
  targetDiameterMm: number,
  center: Vec2,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
): Promise<ReliefComponent> => {
  const { svgSource, resolvedId, substituted } = await loadIconSource(icon.iconId);

  if (substituted) {
    warnings.push(`Icon "${icon.iconId}" not found, using fallback "${resolvedId}".`);
  }

  const pathDataList = extractPathData(svgSource);
  const rawContours = pathDataList.flatMap((d) =>
    flattenPath(parsePathData(d), printProfile.bezierToleranceMm),
  );
  const placed = placeIcon(rawContours, { targetDiameterMm, scale: icon.scale });

  // placeIcon flips Y; normalizeWinding must run after, same trap M1/M4 scripts document.
  const normalized = normalizeWinding(placed);
  const contours = translateContours(normalized, center);

  return { contours, colorGroup: icon.colorGroup };
};

// Shared by every disc-shaped layout (flat and ring alike): a decoration is a standalone
// relief feature, not tied to text or icon placement, so it never depends on which layout
// produced the rest of the token's contours.
const buildDecorationComponents = (decorations: TokenSpec["decorations"]): ReliefComponent[] => {
  return decorations
    .filter((decoration) => decoration.type === "ring")
    .map((decoration) => ({
      contours: computeRingContour(decoration.radiusMm, decoration.widthMm),
      colorGroup: decoration.colorGroup,
    }));
};

const computeDiscReliefComponents = async (
  spec: TokenSpec,
  font: Font,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
): Promise<ReliefComponent[]> => {
  const shape = spec.shape;

  if (shape.type !== "disc") {
    throw new Error("computeDiscReliefComponents requires a disc shape");
  }

  const targetDiameterMm = shape.diameterMm;
  const centerIcons = spec.icons.filter((icon) => icon.side === "center");

  const iconComponents = await Promise.all(
    centerIcons.map((icon) =>
      buildIconComponent(icon, targetDiameterMm, [0, 0], printProfile, loadIconSource, warnings),
    ),
  );

  const lineComponents: ReliefComponent[] = spec.lines.map((line) => ({
    contours: layoutFlatText(
      font,
      { text: line.text, sizeMm: line.sizeMm },
      printProfile.bezierToleranceMm,
    ),
    colorGroup: line.colorGroup,
  }));

  const decorationComponents = buildDecorationComponents(spec.decorations);

  return [...iconComponents, ...lineComponents, ...decorationComponents];
};

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
  };
};

// A full disc with up to two curved text bands (top reading outward, bottom reading inward --
// see the RING_*_CENTER_ANGLE_DEG constants above), a center icon, and ring/border decorations.
// Unlike the ribbon arc's lines, ring lines have no dynamic auto-centering: the disc has no
// content-driven band to center within, so each line's radiusMm is the caller's own explicit
// choice (see catalog/buildBatchItems.ts's Goal Influence token).
const computeRingReliefComponents = async (
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
  const centerIcons = spec.icons.filter((icon) => icon.side === "center");

  const iconComponents = await Promise.all(
    centerIcons.map((icon) =>
      buildIconComponent(icon, targetDiameterMm, [0, 0], printProfile, loadIconSource, warnings),
    ),
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

// Empirically measured against the bundled font (Cooper Black) rendering all-caps arc text,
// via the real pipeline (computeReliefComponents itself): how far a glyph's top edge sits
// above its baseline radius, as a fraction of sizeMm. Deliberately not the font's own
// `ascender` metric, which reserves headroom for accents this all-caps text never uses and
// would overestimate the true ink, throwing off the margin balance below. Remeasure (see this
// file's git history for the throwaway `_measure-new-font.test.ts` approach) if the default
// font ever changes again.
const GLYPH_ASCENT_RATIO = 0.756;
// An absolute mm gap, not proportional to the ribbon band width, so it only makes sense
// relative to the app's own default arc shape (see useBatch.ts's DEFAULT_ARC_SHAPE / Frozen
// Forge measurements). Remeasure via the real pipeline if the default shape's band width
// changes significantly again.
const TWO_LINE_GAP_MM = 0.5;

const estimateAscentMm = (sizeMm: number): number => {
  return sizeMm * GLYPH_ASCENT_RATIO;
};

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

  const [titleLine, subtitleLine] = lines;
  const titleAscentMm = estimateAscentMm(titleLine.sizeMm);
  const subtitleAscentMm = estimateAscentMm(subtitleLine.sizeMm);
  const bandWidthMm = outerRadiusMm - innerRadiusMm;
  const marginMm = (bandWidthMm - titleAscentMm - subtitleAscentMm - TWO_LINE_GAP_MM) / 2;

  const subtitleRadiusMm = innerRadiusMm + marginMm;
  const titleRadiusMm = subtitleRadiusMm + subtitleAscentMm + TWO_LINE_GAP_MM;

  return [titleRadiusMm, subtitleRadiusMm];
};

const computeArcReliefComponents = async (
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

  const nobPlacements = computeNobPlacements(shape, CENTER_ANGLE_DEG);
  const availableSweepDeg = computeSweepDeg(shape) - 2 * NOB_TEXT_CLEARANCE_DEG;
  const ribbonInnerRadiusMm = computeInnerRadiusMm();
  const outerRadiusMm = computeOuterRadiusMm(shape);
  const nominalLineRadiiMm = computeLineRadiiMm(ribbonInnerRadiusMm, outerRadiusMm, spec.lines);

  const iconComponents = await Promise.all(
    spec.icons
      .filter((icon) => icon.side === "left" || icon.side === "right")
      .map((icon) => {
        const position =
          icon.side === "left" ? nobPlacements.left.position : nobPlacements.right.position;

        return buildIconComponent(
          icon,
          computeEffectiveNobDiameterMm(shape),
          position,
          printProfile,
          loadIconSource,
          warnings,
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

    return { contours, colorGroup: line.colorGroup };
  });

  return [...iconComponents, ...lineComponents];
};

export const computeReliefComponents = async (
  spec: TokenSpec,
  font: Font,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
): Promise<ComputeReliefComponentsResult> => {
  const warnings: string[] = [];

  const reliefComponents =
    spec.shape.type === "disc" && spec.textLayout === "ring"
      ? await computeRingReliefComponents(spec, font, printProfile, loadIconSource, warnings)
      : spec.shape.type === "disc"
        ? await computeDiscReliefComponents(spec, font, printProfile, loadIconSource, warnings)
        : await computeArcReliefComponents(spec, font, printProfile, loadIconSource, warnings);

  const validation = await validateMinStrokeWidth(
    reliefComponents.flatMap((component) => component.contours),
    printProfile.minStrokeWidthMm,
  );

  return { reliefComponents, validation, warnings };
};
