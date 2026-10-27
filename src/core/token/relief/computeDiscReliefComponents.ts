import type { Font } from "opentype.js";

import type { ReliefComponent } from "../mesh/reliefComponent";
import { layoutFlatText } from "../text/layoutFlatText";
import type { PrintProfile, TokenSpec } from "../types";
import {
  buildCenterIconComponents,
  buildDecorationComponents,
  type LoadIconSource,
  requireDiscShape,
} from "./computeReliefComponentsShared";

export const computeDiscReliefComponents = async (
  spec: TokenSpec,
  font: Font,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
): Promise<ReliefComponent[]> => {
  const shape = requireDiscShape(spec, "computeDiscReliefComponents");
  const targetDiameterMm = shape.diameterMm;
  const iconComponents = await buildCenterIconComponents(
    spec.icons,
    targetDiameterMm,
    printProfile,
    loadIconSource,
    warnings,
  );

  const lineComponents: ReliefComponent[] = spec.lines.map((line) => ({
    contours: layoutFlatText(
      font,
      { text: line.text, sizeMm: line.sizeMm },
      printProfile.bezierToleranceMm,
    ),
    colorGroup: line.colorGroup,
    source: { kind: "text", text: line.text },
  }));

  const decorationComponents = buildDecorationComponents(spec.decorations);

  return [...iconComponents, ...lineComponents, ...decorationComponents];
};
