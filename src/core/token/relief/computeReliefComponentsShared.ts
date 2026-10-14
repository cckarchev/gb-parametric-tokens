import { rotateContours, translateContours } from "../geometry/contourTransforms";
import { growIconOutline } from "../geometry/growIconOutline";
import { placeIcon } from "../geometry/iconPlacement";
import { computeRingContour } from "../geometry/ringContour";
import { trimIconToCircle } from "../geometry/trimIconToCircle";
import { ReliefComponent } from "../mesh/reliefComponent";
import { extractPathData } from "../svg/extractPathData";
import { flattenPath } from "../svg/flattenPath";
import { normalizeWinding } from "../svg/normalizeWinding";
import { parsePathData } from "../svg/parsePathData";
import { DiscShapeSpec, IconSpec, PrintProfile, TokenSpec, Vec2 } from "../types";

export type LoadIconSourceResult = { svgSource: string; resolvedId: string; substituted: boolean };
export type LoadIconSource = (iconId: string) => Promise<LoadIconSourceResult>;

// How far "grow" extends the body past the icon, in multiples of minStrokeWidthMm. One multiple
// prints but reads as a hairline.
const GROW_MARGIN_MULTIPLIER = 4;

// The flat and ring layouts only ever get a disc spec, but TypeScript can't see the dispatch
// that guarantees it, so both narrow through this guard.
export const requireDiscShape = (spec: TokenSpec, callerName: string): DiscShapeSpec => {
  if (spec.shape.type !== "disc") {
    throw new Error(`${callerName} requires a disc shape, got "${spec.shape.type}"`);
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
  const { svgSource, resolvedId, substituted } = await loadIconSource(icon.iconId);

  if (substituted) {
    warnings.push(`Icon "${icon.iconId}" not found, using fallback "${resolvedId}".`);
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

  // placeIcon flips Y, and a y-flip reverses contour winding (see contourTransforms.ts), so
  // normalizeWinding must run after it. Run it before and manifold silently collapses the icon
  // CrossSection to empty.
  const normalized = normalizeWinding(placed);
  // Trimmed after normalizeWinding, so holes stay holes, and before moving the icon, while it's
  // still centered on the origin. Cut at the full stud or disc radius, not the icon's scaled
  // target.
  const trimmed =
    overflowBehavior === "trim" && overflowsCircle
      ? await trimIconToCircle(normalized, targetDiameterMm / 2)
      : normalized;

  // Rotate about the icon's own center (still at the origin here) before translating it out
  // to its final position, the same rotate-then-translate order applyArcPlacement uses for
  // glyphs.
  const rotated = rotateContours(trimmed, rotationDeg);
  const contours = translateContours(rotated, center);

  // "grow" never touches the icon's own contours (unlike "shrink"/"trim" above): it grows the
  // stud/disc's own body around them instead, so the dilated footprint is computed from the
  // icon's final absolute position, matching the space the base builders place the stud/disc in.
  const growOutline =
    overflowBehavior === "grow" && overflowsCircle
      ? await growIconOutline(contours, printProfile.minStrokeWidthMm * GROW_MARGIN_MULTIPLIER)
      : undefined;

  return {
    contours,
    colorGroup: icon.colorGroup,
    source: { kind: "icon", iconId: icon.iconId },
    // Only "none" leaves the overflow uncorrected, so only "none" needs the attention flag:
    // "shrink", "trim", and "grow" already handled it (see IconOverflowBehavior in types.ts).
    overflowsCircle: overflowBehavior === "none" && overflowsCircle,
    growOutline,
  };
};

// Shared by every disc-shaped layout (flat and ring alike): both center their icons at the
// disc's own center, distinguished only by which side("center") icons are present.
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
      buildIconComponent(icon, targetDiameterMm, [0, 0], printProfile, loadIconSource, warnings),
    ),
  );
};

// Shared by every disc-shaped layout (flat and ring alike): a decoration is a standalone
// relief feature, not tied to text or icon placement, so it never depends on which layout
// produced the rest of the token's contours.
export const buildDecorationComponents = (
  decorations: TokenSpec["decorations"],
): ReliefComponent[] => {
  return decorations
    .filter((decoration) => decoration.type === "ring")
    .map((decoration) => ({
      contours: computeRingContour(decoration.radiusMm, decoration.widthMm),
      colorGroup: decoration.colorGroup,
      source: { kind: "decoration" as const },
    }));
};
