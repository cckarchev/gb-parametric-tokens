import type { Font } from "opentype.js";

import { computeArcReliefComponents } from "./computeArcReliefComponents";
import { computeDiscReliefComponents } from "./computeDiscReliefComponents";
import { LoadIconSource, LoadIconSourceResult } from "./computeReliefComponentsShared";
import { computeRingReliefComponents } from "./computeRingReliefComponents";
import { ReliefComponent, ReliefComponentSource } from "./mesh/reliefComponent";
import { PrintProfile, TokenSpec } from "./types";
import { ComponentFailure, validateMinStrokeWidth } from "./validation/validateMinStrokeWidth";

export type { LoadIconSource, LoadIconSourceResult };

const UNKNOWN_SOURCE: ReliefComponentSource = { kind: "unknown" };

export type ComputeReliefComponentsResult = {
  reliefComponents: ReliefComponent[];
  valid: boolean;
  componentFailures: ComponentFailure[];
  warnings: string[];
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

  const componentFailures = [...strokeWidthFailures, ...iconOverflowFailures];

  return { reliefComponents, valid: componentFailures.length === 0, componentFailures, warnings };
};
