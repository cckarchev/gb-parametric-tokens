import { placeIcon, rotateContours, translateContours } from "./geometry/iconPlacement";
import { computeRingContour } from "./geometry/ringContour";
import { trimIconToCircle } from "./geometry/trimIconToCircle";
import { ReliefComponent } from "./mesh/reliefComponent";
import { extractPathData } from "./svg/extractPathData";
import { flattenPath } from "./svg/flattenPath";
import { normalizeWinding } from "./svg/normalizeWinding";
import { parsePathData } from "./svg/parsePathData";
import { IconSpec, PrintProfile, TokenSpec, Vec2 } from "./types";

export type LoadIconSourceResult = { svgSource: string; resolvedId: string; substituted: boolean };
export type LoadIconSource = (iconId: string) => Promise<LoadIconSourceResult>;

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

  // placeIcon flips Y; normalizeWinding must run after, same trap M1/M4 scripts document.
  const normalized = normalizeWinding(placed);
  // Trimming needs correctly wound contours (so a hole stays a hole under the intersection),
  // hence after normalizeWinding -- and still in the icon's own local space, centered on the
  // origin, hence before rotate/translate below.
  // The real nob/disc radius, not scaled by icon.scale -- trim only cuts what actually pokes
  // past the physical circle, same reference placeIcon's own circle-fit check uses (see its
  // comment on circleFitScaleFactor), not the icon's smaller nominal-size target.
  const trimmed =
    overflowBehavior === "trim" && overflowsCircle
      ? await trimIconToCircle(normalized, targetDiameterMm / 2)
      : normalized;

  // Rotate about the icon's own center (still at the origin here) before translating it out
  // to its final position, the same rotate-then-translate order applyArcPlacement uses for
  // glyphs.
  const rotated = rotateContours(trimmed, rotationDeg);
  const contours = translateContours(rotated, center);

  return {
    contours,
    colorGroup: icon.colorGroup,
    source: { kind: "icon", iconId: icon.iconId },
    // Only "none" leaves the overflow uncorrected, so only "none" needs the attention flag --
    // "shrink" and "trim" already fixed it (see IconOverflowBehavior in types.ts).
    overflowsCircle: overflowBehavior === "none" && overflowsCircle,
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
