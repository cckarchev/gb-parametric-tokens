import { TokenSpec } from "../types";
import { applyReliefToBase } from "./applyReliefToBase";
import { getManifoldModule } from "./manifoldModule";
import { ReliefComponent } from "./reliefComponent";
import { TokenPart } from "./tokenPart";

const DISC_CIRCULAR_SEGMENTS = 128;

export type BuildTokenMeshInput = {
  spec: TokenSpec;
  reliefComponents: ReliefComponent[];
};

export const buildTokenMesh = async (input: BuildTokenMeshInput): Promise<TokenPart[]> => {
  if (input.spec.shape.type !== "disc") {
    throw new Error(
      `buildTokenMesh only supports shape: "disc" in M1, got "${input.spec.shape.type}"`,
    );
  }

  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const baseThicknessMm = input.spec.style.baseThicknessMm;

  const base = CrossSection.circle(input.spec.shape.diameterMm / 2, DISC_CIRCULAR_SEGMENTS).extrude(
    baseThicknessMm,
  );

  return applyReliefToBase(base, input.spec.style, input.reliefComponents, CrossSection);
};
