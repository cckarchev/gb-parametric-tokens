import type { CrossSection } from "manifold-3d";

import {
  OFFSET_ARC_SEGMENTS,
  OFFSET_MITER_LIMIT,
} from "../geometry/circleResolution";
import { getManifoldModule } from "../mesh/manifoldModule";
import type { ReliefComponentSource } from "../mesh/reliefComponent";
import type { Vec2 } from "../types";
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
  const erode = (section: CrossSection): CrossSection =>
    section.offset(
      erosionRadiusMm,
      "Round",
      OFFSET_MITER_LIMIT,
      OFFSET_ARC_SEGMENTS,
    );

  const relief = new CrossSection(reliefContours, "Positive");

  // Each connected feature is eroded on its own. Eroding the whole relief at once can't tell:
  // a thick icon always survives and hides a vanished glyph, and erosion can split a glyph, so
  // counting pieces before and after doesn't work either.
  //
  // decompose() of an empty section returns one empty section, not an empty list.
  const features = relief.isEmpty()
    ? []
    : relief.decompose().filter((one) => !one.isEmpty());
  const vanishedFeatureCount = features.filter((feature) =>
    erode(feature).isEmpty(),
  ).length;

  return {
    valid: vanishedFeatureCount === 0,
    featureCount: features.length,
    vanishedFeatureCount,
  };
};

// One relief component (a text line, an icon, a decoration) with details too thin to print.
type StrokeWidthFailure = {
  kind: "stroke-width";
  source: ReliefComponentSource;
  vanishedFeatureCount: number;
  featureCount: number;
};

// An icon that reaches past its stud or disc, with overflow behavior "none" (the other
// behaviors fix it). Relief isn't clipped to the base, so the excess prints as an unsupported
// overhang.
type IconOverflowFailure = {
  kind: "icon-overflow";
  source: Extract<ReliefComponentSource, { kind: "icon" }>;
};

// Every reason a token can land in the "needs attention" list. computeReliefComponents.ts
// combines every kind into one list, describeTokenFailures.ts turns it into one reason string
// per token.
export type ComponentFailure =
  | StrokeWidthFailure
  | IconOverflowFailure
  | LayoutGeometryFailure;

const describeReliefComponentSource = (
  source: ReliefComponentSource,
): string => {
  switch (source.kind) {
    case "text":
      return `Text "${source.text}"`;
    case "icon":
      return `Icon "${source.iconId}"`;
    case "decoration":
      return "Decoration";
  }
};

// The count alone, for a caller that already names the source.
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
