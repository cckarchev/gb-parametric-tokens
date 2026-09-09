import type { Font } from "opentype.js";

import {
  buildCenterIconComponents,
  buildDecorationComponents,
  LoadIconSource,
} from "./computeReliefComponentsShared";
import { ReliefComponent } from "./mesh/reliefComponent";
import { layoutFlatText } from "./text/layoutFlatText";
import { PrintProfile, TokenSpec } from "./types";

export const computeDiscReliefComponents = async (
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
