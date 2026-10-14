import { buildDiscFootprint } from "../geometry/discFootprint";
import { TokenSpec } from "../types";
import { applyReliefToBase } from "./applyReliefToBase";
import { getManifoldModule } from "./manifoldModule";
import { collectGrowOutlineContours, ReliefComponent } from "./reliefComponent";
import { TokenPart } from "./tokenPart";

type BuildTokenMeshInput = {
  spec: TokenSpec;
  reliefComponents: ReliefComponent[];
};

export const buildTokenMesh = async (input: BuildTokenMeshInput): Promise<TokenPart[]> => {
  if (input.spec.shape.type !== "disc") {
    throw new Error(
      `buildTokenMesh only supports a "disc" shape, got "${input.spec.shape.type}": an arc shape goes through buildArcTokenMesh instead (see buildTokenParts.ts)`,
    );
  }

  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const baseThicknessMm = input.spec.style.baseThicknessMm;

  const footprint = buildDiscFootprint(CrossSection, input.spec.shape);
  const disc = footprint.extrude(baseThicknessMm);

  // A center icon with behavior "grow" adds its footprint to the disc.
  const growContours = collectGrowOutlineContours(input.reliefComponents);
  const base =
    growContours.length > 0
      ? disc.add(new CrossSection(growContours, "Positive").extrude(baseThicknessMm))
      : disc;

  return applyReliefToBase(base, input.spec.style, input.reliefComponents, CrossSection);
};
