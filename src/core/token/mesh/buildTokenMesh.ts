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

  const disc = CrossSection.circle(input.spec.shape.diameterMm / 2, DISC_CIRCULAR_SEGMENTS).extrude(
    baseThicknessMm,
  );

  // IconOverflowBehavior "grow" (see types.ts): a center icon that overflowed the disc's plain
  // circle carries its own dilated footprint here (computeReliefComponentsShared.ts), already
  // centered the same way the disc is, so unioning it in makes the disc's own body hug the icon
  // instead of leaving it a plain circle.
  const growContours = input.reliefComponents.flatMap((component) => component.growOutline ?? []);
  const base =
    growContours.length > 0
      ? disc.add(new CrossSection(growContours, "Positive").extrude(baseThicknessMm))
      : disc;

  return applyReliefToBase(base, input.spec.style, input.reliefComponents, CrossSection);
};
