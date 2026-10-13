import type { Font } from "opentype.js";

import { CENTER_ANGLE_DEG } from "../geometry/angleConventions";
import {
  collectGrowOutlineContours,
  ReliefComponent,
  ReliefComponentSource,
} from "../mesh/reliefComponent";
import { computeBaseOutlineContours } from "../preview/computeBaseOutlineContours";
import { PrintProfile, TokenSpec } from "../types";
import { validateLayoutGeometry } from "../validation/validateLayoutGeometry";
import { ComponentFailure, validateMinStrokeWidth } from "../validation/validateMinStrokeWidth";
import { computeArcReliefComponents } from "./computeArcReliefComponents";
import { computeDiscReliefComponents } from "./computeDiscReliefComponents";
import { LoadIconSource, LoadIconSourceResult } from "./computeReliefComponentsShared";
import { computeRingReliefComponents } from "./computeRingReliefComponents";

export type { LoadIconSource, LoadIconSourceResult };

const UNKNOWN_SOURCE: ReliefComponentSource = { kind: "unknown" };

export type ComputeReliefComponentsResult = {
  reliefComponents: ReliefComponent[];
  // False whenever anything needs attention, layout warnings included: drives the preview's
  // "needs attention" list and the contact sheet marker.
  valid: boolean;
  // Only the failures that make a print go wrong (a detail too thin to print, an icon's
  // unsupported overhang) stop the export. Layout warnings (see validateLayoutGeometry.ts) are
  // left to the user's judgment in the preview: a crest grazing a long name still prints fine.
  blocksExport: boolean;
  componentFailures: ComponentFailure[];
  warnings: string[];
};

// The one signature every layout arm implements. Having it named is what lets the dispatch below
// pick an arm and call it once, instead of repeating the same five arguments per branch.
type ComputeLayoutComponents = (
  spec: TokenSpec,
  font: Font,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
) => Promise<ReliefComponent[]>;

// Only a disc can carry the ring layout; everything else is an arc, whose text layout is never
// anything but "arc".
const selectLayoutComputation = (spec: TokenSpec): ComputeLayoutComponents => {
  if (spec.shape.type !== "disc") {
    return computeArcReliefComponents;
  }

  if (spec.textLayout === "ring") {
    return computeRingReliefComponents;
  }

  return computeDiscReliefComponents;
};

export const computeReliefComponents = async (
  spec: TokenSpec,
  font: Font,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
): Promise<ComputeReliefComponentsResult> => {
  const warnings: string[] = [];

  const computeLayoutComponents = selectLayoutComputation(spec);
  const reliefComponents = await computeLayoutComponents(
    spec,
    font,
    printProfile,
    loadIconSource,
    warnings,
  );

  // Validated one component at a time (not the old single union over every contour combined) so
  // a failure can be traced back to the specific text line or icon it came from, instead of just
  // a token-wide count -- see validateMinStrokeWidth.ts's describeComponentFailure.
  const componentValidations = await Promise.all(
    reliefComponents.map((component) =>
      validateMinStrokeWidth(component.contours, printProfile.minStrokeWidthMm),
    ),
  );

  const strokeWidthFailures: ComponentFailure[] = reliefComponents
    .map((component, index) => ({ component, validation: componentValidations[index] }))
    .filter(({ validation }) => !validation.valid)
    .map(({ component, validation }) => ({
      kind: "stroke-width" as const,
      source: component.source ?? UNKNOWN_SOURCE,
      vanishedFeatureCount: validation.vanishedFeatureCount,
      featureCount: validation.featureCount,
    }));

  // Only icons left uncorrected reach here: computeReliefComponentsShared.ts sets
  // overflowsCircle solely for IconOverflowBehavior "none", since "shrink", "trim" and "grow"
  // each already handled the overflow. So this flags real, uncorrected overhang, the same way an
  // icon substitution becomes a warning above.
  const iconOverflowFailures: ComponentFailure[] = reliefComponents
    .filter(
      (component): component is typeof component & { source: { kind: "icon"; iconId: string } } =>
        component.overflowsCircle === true && component.source?.kind === "icon",
    )
    .map((component) => ({ kind: "icon-overflow" as const, source: component.source }));

  // Checked against the same outline the preview draws (grown icons included), so a flagged
  // token and the picture of it always agree.
  const footprintContours = await computeBaseOutlineContours(
    spec.shape,
    CENTER_ANGLE_DEG,
    collectGrowOutlineContours(reliefComponents),
  );
  const layoutFailures = await validateLayoutGeometry(reliefComponents, footprintContours);

  const blockingFailures = [...strokeWidthFailures, ...iconOverflowFailures];
  const componentFailures = [...blockingFailures, ...layoutFailures];

  return {
    reliefComponents,
    valid: componentFailures.length === 0,
    blocksExport: blockingFailures.length > 0,
    componentFailures,
    warnings,
  };
};
