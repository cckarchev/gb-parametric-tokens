import type { Font } from "opentype.js";

import { computeArcReliefComponents } from "./computeArcReliefComponents";
import { computeDiscReliefComponents } from "./computeDiscReliefComponents";
import { LoadIconSource, LoadIconSourceResult } from "./computeReliefComponentsShared";
import { computeRingReliefComponents } from "./computeRingReliefComponents";
import { ReliefComponent } from "./mesh/reliefComponent";
import { PrintProfile, TokenSpec } from "./types";
import {
  MinStrokeWidthValidation,
  validateMinStrokeWidth,
} from "./validation/validateMinStrokeWidth";

export type { LoadIconSource, LoadIconSourceResult };

export type ComputeReliefComponentsResult = {
  reliefComponents: ReliefComponent[];
  validation: MinStrokeWidthValidation;
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

  const validation = await validateMinStrokeWidth(
    reliefComponents.flatMap((component) => component.contours),
    printProfile.minStrokeWidthMm,
  );

  return { reliefComponents, validation, warnings };
};
