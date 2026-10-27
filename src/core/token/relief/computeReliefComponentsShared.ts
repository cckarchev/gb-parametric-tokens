import {
  rotateContours,
  translateContours,
} from "../geometry/contourTransforms";
import { growIconOutline } from "../geometry/growIconOutline";
import { placeIcon } from "../geometry/iconPlacement";
import { computeRingContour } from "../geometry/ringContour";
import { trimIconToCircle } from "../geometry/trimIconToCircle";
import type { ReliefComponent } from "../mesh/reliefComponent";
import { extractPathData } from "../svg/extractPathData";
import { flattenPath } from "../svg/flattenPath";
import { normalizeWinding } from "../svg/normalizeWinding";
import { parsePathData } from "../svg/parsePathData";
import type {
  DiscShapeSpec,
  IconSpec,
  PrintProfile,
  TokenSpec,
  Vec2,
} from "../types";

export type LoadIconSourceResult = {
  svgSource: string;
  resolvedId: string;
  substituted: boolean;
};
export type LoadIconSource = (iconId: string) => Promise<LoadIconSourceResult>;

// How far "grow" extends the body past the icon, in multiples of
// minStrokeWidthMm. One multiple prints but reads as a hairline.
const GROW_MARGIN_MULTIPLIER = 4;

// The flat and ring layouts only ever get a disc spec, but TypeScript can't see
// the dispatch that guarantees it, so both narrow through this guard.
export const requireDiscShape = (
  spec: TokenSpec,
  callerName: string,
): DiscShapeSpec => {
  if (spec.shape.type !== "disc") {
    throw new Error(
      `${callerName} requires a disc shape, got "${spec.shape.type}"`,
    );
  }

  return spec.shape;
};

export const buildIconComponent = async (
  icon: IconSpec,
  targetDiameterMm: number,
  center: Vec2,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
  rotationDeg = 0,
): Promise<ReliefComponent> => {
  const { svgSource, resolvedId, substituted } = await loadIconSource(
    icon.iconId,
  );

  if (substituted) {
    warnings.push(
      `Icon "${icon.iconId}" not found, using fallback "${resolvedId}".`,
    );
  }

  const overflowBehavior = icon.overflowBehavior ?? "none";

  const pathDataList = extractPathData(svgSource);
  const rawContours = pathDataList.flatMap((d) =>
    flattenPath(parsePathData(d), printProfile.bezierToleranceMm),
  );
  const { contours: placed, overflowsCircle } = placeIcon(rawContours, {
    targetDiameterMm,
    scale: icon.scale,
    constrainToCircle: overflowBehavior === "shrink",
  });

  // placeIcon flips Y, and a y-flip reverses contour winding (see
  // contourTransforms.ts), so normalizeWinding must run after it. Run it before
  // and manifold silently collapses the icon CrossSection to empty.
  const normalized = normalizeWinding(placed);
  // Trimmed after normalizeWinding, so holes stay holes, and before moving the
  // icon, while it's still centered on the origin. Cut at the full stud or disc
  // radius, not the icon's scaled target.
  const trimmed =
    overflowBehavior === "trim" && overflowsCircle
      ? await trimIconToCircle(normalized, targetDiameterMm / 2)
      : normalized;

  // Rotate about the icon's own center (still at the origin here) before
  // translating it out to its final position, the same rotate-then-translate
  // order applyArcPlacement uses for glyphs.
  const rotated = rotateContours(trimmed, rotationDeg);
  const contours = translateContours(rotated, center);

  // "grow" leaves the icon alone and grows the body instead, so the footprint
  // is taken from the icon's final position.
  const growOutline =
    overflowBehavior === "grow" && overflowsCircle
      ? await growIconOutline(
          contours,
          printProfile.minStrokeWidthMm * GROW_MARGIN_MULTIPLIER,
        )
      : undefined;

  return {
    contours,
    colorGroup: icon.colorGroup,
    source: { kind: "icon", iconId: icon.iconId },
    // Only "none" leaves the overflow uncorrected.
    overflowsCircle: overflowBehavior === "none" && overflowsCircle,
    growOutline,
  };
};

// The center icons of a disc, for both the flat and ring layouts.
export const buildCenterIconComponents = (
  icons: IconSpec[],
  targetDiameterMm: number,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
): Promise<ReliefComponent[]> => {
  const centerIcons = icons.filter((icon) => icon.side === "center");

  return Promise.all(
    centerIcons.map((icon) =>
      buildIconComponent(
        icon,
        targetDiameterMm,
        [0, 0],
        printProfile,
        loadIconSource,
        warnings,
      ),
    ),
  );
};

// A disc's decorations, the same in the flat and ring layouts.
export const buildDecorationComponents = (
  decorations: TokenSpec["decorations"],
): ReliefComponent[] =>
  decorations
    .filter((decoration) => decoration.type === "ring")
    .map((decoration) => ({
      contours: computeRingContour(decoration.radiusMm, decoration.widthMm),
      colorGroup: decoration.colorGroup,
      source: { kind: "decoration" as const },
    }));
