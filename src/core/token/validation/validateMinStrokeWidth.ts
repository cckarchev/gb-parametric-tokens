import type { CrossSection } from "manifold-3d";

import { getManifoldModule } from "../mesh/manifoldModule";
import { ReliefComponentSource } from "../mesh/reliefComponent";
import { Vec2 } from "../types";

const EROSION_CIRCULAR_SEGMENTS = 32;

export type MinStrokeWidthValidation = {
  valid: boolean;
  areaBeforeMm2: number;
  areaAfterErosionMm2: number;
  featureCount: number;
  vanishedFeatureCount: number;
};

export const validateMinStrokeWidth = async (
  reliefContours: Vec2[][],
  minStrokeWidthMm: number,
): Promise<MinStrokeWidthValidation> => {
  const wasm = await getManifoldModule();
  const { CrossSection } = wasm;

  const erosionRadiusMm = -minStrokeWidthMm / 2;
  const erode = (section: CrossSection): CrossSection => {
    return section.offset(erosionRadiusMm, "Round", 2, EROSION_CIRCULAR_SEGMENTS);
  };

  const relief = new CrossSection(reliefContours, "Positive");
  const eroded = erode(relief);

  // Asking only whether the eroded union is non-empty is useless on a composed token: the
  // icons are far thicker than minStrokeWidthMm, always survive, and mask any hairline glyph
  // that disappeared. Counting pieces before against after does not work either, because
  // erosion routinely SPLITS a glyph into several pieces, so the total can rise while a
  // separate feature is lost. Eroding each connected feature on its own is what actually
  // answers the question "did any feature vanish".
  // CrossSection#decompose() returns one empty section for an empty input rather than an
  // empty list, hence the isEmpty guard before decomposing.
  const features = relief.isEmpty() ? [] : relief.decompose().filter((one) => !one.isEmpty());
  const vanishedFeatureCount = features.filter((feature) => erode(feature).isEmpty()).length;

  return {
    valid: vanishedFeatureCount === 0,
    areaBeforeMm2: relief.area(),
    areaAfterErosionMm2: eroded.area(),
    featureCount: features.length,
    vanishedFeatureCount,
  };
};

// One relief component (a text line, an icon, a decoration) that failed the min-stroke-width
// check, computed by running validateMinStrokeWidth per component instead of once over every
// contour combined -- see computeReliefComponents.ts.
export type StrokeWidthFailure = {
  kind: "stroke-width";
  source: ReliefComponentSource;
  vanishedFeatureCount: number;
  featureCount: number;
};

// An icon whose own farthest point poked past its target circle under a plain bounding-box fit
// (see geometry/iconPlacement.ts's placeIcon) -- the icon was shrunk to fit, but that's worth
// flagging: a raised relief icon is unioned onto the base with no clip against the stud/disc's own
// circle (applyReliefToBase.ts), so it's the kind of correction the user should double-check
// against the real render, not just an assurance nothing exceeded the target scale.
export type IconOverflowFailure = {
  kind: "icon-overflow";
  source: Extract<ReliefComponentSource, { kind: "icon" }>;
};

// Every reason a relief component can land in the "needs attention" list -- computeReliefComponents.ts
// combines both kinds into one list, tokenWorker.ts turns it into one reason string per token.
export type ComponentFailure = StrokeWidthFailure | IconOverflowFailure;

const describeReliefComponentSource = (source: ReliefComponentSource): string => {
  switch (source.kind) {
    case "text":
      return `Text "${source.text}"`;
    case "icon":
      return `Icon "${source.iconId}"`;
    case "decoration":
      return "Decoration";
    case "unknown":
      return "This detail";
  }
};

// The bare count, with no source label -- for a caller that already names the source some other
// way (tokenWorker.ts drops the redundant "Text "..."" prefix when a token's only failing
// component is its own title, since the surrounding UI already names that token by title).
export const describeVanishedDetailCount = (
  failure: Pick<StrokeWidthFailure, "vanishedFeatureCount" | "featureCount">,
): string => {
  const { vanishedFeatureCount, featureCount } = failure;
  const detailWord = featureCount === 1 ? "detail" : "details";

  return `${vanishedFeatureCount} of ${featureCount} ${detailWord} too thin to print at this size.`;
};

const ICON_OVERFLOW_MESSAGE = "extends past its printed edge, shrunk to fit the circle.";

// Shared by the UI (the "N tokens need attention" list) and the contact-sheet preview marker, so
// both describe the same failure in the same words.
export const describeComponentFailure = (failure: ComponentFailure): string => {
  const detail =
    failure.kind === "icon-overflow" ? ICON_OVERFLOW_MESSAGE : describeVanishedDetailCount(failure);

  return `${describeReliefComponentSource(failure.source)}: ${detail}`;
};
