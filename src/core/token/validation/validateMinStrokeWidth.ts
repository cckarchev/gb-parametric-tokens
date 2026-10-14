import type { CrossSection } from "manifold-3d";

import { OFFSET_ARC_SEGMENTS, OFFSET_MITER_LIMIT } from "../geometry/circleResolution";
import { getManifoldModule } from "../mesh/manifoldModule";
import { ReliefComponentSource } from "../mesh/reliefComponent";
import { Vec2 } from "../types";
import type { LayoutGeometryFailure } from "./validateLayoutGeometry";

type MinStrokeWidthValidation = {
  valid: boolean;
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
    return section.offset(erosionRadiusMm, "Round", OFFSET_MITER_LIMIT, OFFSET_ARC_SEGMENTS);
  };

  const relief = new CrossSection(reliefContours, "Positive");

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
    featureCount: features.length,
    vanishedFeatureCount,
  };
};

// One relief component (a text line, an icon, a decoration) that failed the min-stroke-width
// check, computed by running validateMinStrokeWidth per component instead of once over every
// contour combined: see computeReliefComponents.ts.
type StrokeWidthFailure = {
  kind: "stroke-width";
  source: ReliefComponentSource;
  vanishedFeatureCount: number;
  featureCount: number;
};

// An icon whose own farthest point poked past its target circle under a plain bounding-box fit
// (see geometry/iconPlacement.ts's placeIcon) AND that nothing corrected: this failure is only
// ever raised for IconOverflowBehavior "none" (see computeReliefComponentsShared.ts, which clears
// the flag for "shrink", "trim" and "grow" because each of those already handled it). So the icon
// really does print past the circle, and a raised relief icon is unioned onto the base with no
// clip against the stud/disc's own circle (applyReliefToBase.ts), leaving that excess as an
// unsupported overhang.
type IconOverflowFailure = {
  kind: "icon-overflow";
  source: Extract<ReliefComponentSource, { kind: "icon" }>;
};

// Every reason a token can land in the "needs attention" list. computeReliefComponents.ts
// combines every kind into one list, describeTokenFailures.ts turns it into one reason string
// per token.
export type ComponentFailure = StrokeWidthFailure | IconOverflowFailure | LayoutGeometryFailure;

const describeReliefComponentSource = (source: ReliefComponentSource): string => {
  switch (source.kind) {
    case "text":
      return `Text "${source.text}"`;
    case "icon":
      return `Icon "${source.iconId}"`;
    case "decoration":
      return "Decoration";
  }
};

// The bare count, with no source label: for a caller that already names the source some other
// way (describeTokenFailures.ts drops the redundant "Text "..."" prefix when a token's only failing
// component is its own title, since the surrounding UI already names that token by title).
export const describeVanishedDetailCount = (
  failure: Pick<StrokeWidthFailure, "vanishedFeatureCount" | "featureCount">,
): string => {
  const { vanishedFeatureCount, featureCount } = failure;
  const detailWord = featureCount === 1 ? "detail" : "details";

  return `${vanishedFeatureCount} of ${featureCount} ${detailWord} too thin to print at this size.`;
};

const ICON_OVERFLOW_MESSAGE =
  'extends past its circle and nothing corrects it. See "Icons that overflow their circle".';
const OUTSIDE_FOOTPRINT_MESSAGE = "runs past the token's edge.";
const BROKEN_FOOTPRINT_MESSAGE =
  "The token's outline came out empty or in separate pieces: check its shape settings.";

// Shared by the UI (the "N tokens need attention" list) and the contact-sheet preview marker, so
// both describe the same failure in the same words.
export const describeComponentFailure = (failure: ComponentFailure): string => {
  switch (failure.kind) {
    case "stroke-width":
      return `${describeReliefComponentSource(failure.source)}: ${describeVanishedDetailCount(failure)}`;
    case "icon-overflow":
      return `${describeReliefComponentSource(failure.source)}: ${ICON_OVERFLOW_MESSAGE}`;
    case "outside-footprint":
      return `${describeReliefComponentSource(failure.source)}: ${OUTSIDE_FOOTPRINT_MESSAGE}`;
    case "crest-over-text": {
      const iconLabel = describeReliefComponentSource(failure.source);
      const textLabel = describeReliefComponentSource(failure.textSource);

      return `${iconLabel} overlaps ${textLabel}.`;
    }
    case "broken-footprint":
      return BROKEN_FOOTPRINT_MESSAGE;
  }
};
