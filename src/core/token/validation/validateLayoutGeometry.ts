import type { CrossSection } from "manifold-3d";

import { getManifoldModule } from "../mesh/manifoldModule";
import { ReliefComponent, ReliefComponentSource } from "../mesh/reliefComponent";
import { Vec2 } from "../types";

// Below anything printable, above the polygon noise of flattened curves and circle segments.
const AREA_EPSILON_MM2 = 0.05;
const WHOLE_FOOTPRINT_PIECE_COUNT = 1;
const UNKNOWN_SOURCE: ReliefComponentSource = { kind: "unknown" };

export type LayoutGeometryFailure =
  | { kind: "outside-footprint"; source: ReliefComponentSource }
  | { kind: "crest-over-text"; source: ReliefComponentSource; textSource: ReliefComponentSource }
  | { kind: "broken-footprint"; pieceCount: number };

type ComponentSection = {
  component: ReliefComponent;
  section: CrossSection;
};

// Icons have their own, finer check against their target circle (see iconPlacement.ts), so only
// text and decorations are measured against the footprint here.
const isPastEdgeCandidate = (component: ReliefComponent): boolean => {
  const kind = component.source?.kind;

  return kind === "text" || kind === "decoration";
};

const hasSourceKind = (entry: ComponentSection, kind: ReliefComponentSource["kind"]): boolean => {
  return entry.component.source?.kind === kind;
};

// CrossSection#decompose() returns one empty section for an empty input rather than an empty
// list, hence the isEmpty guard.
const countPieces = (section: CrossSection): number => {
  if (section.isEmpty()) {
    return 0;
  }

  return section.decompose().filter((piece) => !piece.isEmpty()).length;
};

const findPastEdgeFailures = (
  sections: ComponentSection[],
  footprint: CrossSection,
): LayoutGeometryFailure[] => {
  const failures: LayoutGeometryFailure[] = [];

  for (const { component, section } of sections) {
    if (!isPastEdgeCandidate(component)) {
      continue;
    }

    const pastEdgeAreaMm2 = section.subtract(footprint).area();

    if (pastEdgeAreaMm2 > AREA_EPSILON_MM2) {
      failures.push({ kind: "outside-footprint", source: component.source ?? UNKNOWN_SOURCE });
    }
  }

  return failures;
};

const findCrestOverTextFailures = (sections: ComponentSection[]): LayoutGeometryFailure[] => {
  const icons = sections.filter((entry) => hasSourceKind(entry, "icon"));
  const texts = sections.filter((entry) => hasSourceKind(entry, "text"));
  const failures: LayoutGeometryFailure[] = [];

  for (const iconEntry of icons) {
    for (const textEntry of texts) {
      const overlapAreaMm2 = iconEntry.section.intersect(textEntry.section).area();

      if (overlapAreaMm2 > AREA_EPSILON_MM2) {
        failures.push({
          kind: "crest-over-text",
          source: iconEntry.component.source ?? UNKNOWN_SOURCE,
          textSource: textEntry.component.source ?? UNKNOWN_SOURCE,
        });
      }
    }
  }

  return failures;
};

// Settings that the fields' own bounds allow can still combine into a broken token: text too big
// for its band, a crest that grew into the text, a crow's foot whose corner rounding ate its
// spokes. These are geometric facts about the laid-out token, so they are checked here, once,
// for every layout, instead of guessing them from the settings.
export const validateLayoutGeometry = async (
  components: ReliefComponent[],
  footprintContours: Vec2[][],
): Promise<LayoutGeometryFailure[]> => {
  const { CrossSection } = await getManifoldModule();
  // The CrossSection constructor rejects an empty contour list, so an empty footprint is built as
  // the (empty) union of nothing.
  const footprint =
    footprintContours.length === 0
      ? CrossSection.union([])
      : new CrossSection(footprintContours, "Positive");
  const pieceCount = countPieces(footprint);

  const footprintFailures: LayoutGeometryFailure[] =
    pieceCount === WHOLE_FOOTPRINT_PIECE_COUNT ? [] : [{ kind: "broken-footprint", pieceCount }];

  const sections = components.map((component) => ({
    component,
    section: new CrossSection(component.contours, "Positive"),
  }));

  return [
    ...footprintFailures,
    ...findPastEdgeFailures(sections, footprint),
    ...findCrestOverTextFailures(sections),
  ];
};
