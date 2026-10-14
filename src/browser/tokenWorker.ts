/// <reference lib="webworker" />
import { describeError } from "@/core/describeError";
import { buildTokenParts } from "@/core/token/buildTokenParts";
import { TokenItem } from "@/core/token/catalog/tokenItems/tokenItem";
import {
  buildCombinedThreeMfModelXml,
  CombinedThreeMfItem,
} from "@/core/token/export/combinedThreeMfModel";
import { buildThreeMfArchive } from "@/core/token/export/threeMfArchive";
import { CENTER_ANGLE_DEG } from "@/core/token/geometry/angleConventions";
import { computePlateLayout, PlateLayoutItem } from "@/core/token/geometry/computePlateLayout";
import {
  computeEffectiveStudDiameterMm,
  computeOuterRadiusMm,
} from "@/core/token/geometry/studPlacement";
import { ReliefComponent } from "@/core/token/mesh/reliefComponent";
import { computeBaseOutlineContours } from "@/core/token/preview/computeBaseOutlineContours";
import { PRINT_PROFILES } from "@/core/token/printProfiles";
import { computeReliefComponents } from "@/core/token/relief/computeReliefComponents";
import { ColorGroupSpec, ShapeSpec } from "@/core/token/types";
import {
  ComponentFailure,
  describeComponentFailure,
  describeVanishedDetailCount,
} from "@/core/token/validation/validateMinStrokeWidth";

import { loadFont } from "./loadFont";
import { loadIconManifest } from "./loadIconManifest";
import { createLoadIconSource } from "./loadIconSource";

const PLATE_SPACING_MM = 10;

export type PreviewRequest = { kind: "preview"; requestId: number; items: TokenItem[] };
export type PreviewItem = {
  id: string;
  label: string;
  group?: string;
  name: string;
  shape: ShapeSpec;
  baseContours: [number, number][][];
  reliefComponents: ReliefComponent[];
  warnings: string[];
  copies: number;
  valid: boolean;
  reason: string;
};
export type PreviewResponse = {
  kind: "preview";
  requestId: number;
  results: PreviewItem[];
  validCount: number;
  invalidCount: number;
};

export type ExportRequest = {
  kind: "export";
  requestId: number;
  items: TokenItem[];
  colorGroups: ColorGroupSpec[];
};
export type ExportFailureItem = { id: string; label: string; reason: string };
export type ExportSuccess = {
  kind: "export";
  requestId: number;
  status: "ok";
  archive: Uint8Array;
};
export type ExportFailure = {
  kind: "export";
  requestId: number;
  status: "failed";
  failures: ExportFailureItem[];
};
export type ExportResponse = ExportSuccess | ExportFailure;

export type WorkerErrorResponse = { kind: "error"; requestId: number; message: string };

export type WorkerRequest = PreviewRequest | ExportRequest;
export type WorkerResponse = PreviewResponse | ExportResponse | WorkerErrorResponse;

let resourcesPromise: ReturnType<typeof loadResources> | undefined;

const loadResources = async () => {
  const [font, manifest] = await Promise.all([loadFont(), loadIconManifest()]);

  return { font, loadIconSource: createLoadIconSource(manifest) };
};

const getResources = () => {
  if (!resourcesPromise) {
    resourcesPromise = loadResources();
  }

  return resourcesPromise;
};

// Most invalid tokens have exactly one line of text and no effect text, so their only failing
// component's text is identical to the token's own name: the UI already names the token by
// that name (see ExportPanel.tsx), so repeating it as `Text "The Owner": ...` right next to it
// read as pure noise (user feedback, caught live in the browser). Naming the source still earns
// its keep whenever it's NOT just restating the name: an icon, or a second line whose own text
// differs from the name.
// One failure per line (not joined with a space): a run-on paragraph of several "Icon ...:
// Text ...: Text ...:" clauses back to back read as illegible (user feedback). ExportPanel.tsx
// and the contact-sheet marker's tooltip both render \n as a real line break.
const describeReason = (name: string, componentFailures: ComponentFailure[]): string => {
  const messages = componentFailures.map((failure) =>
    failure.kind === "stroke-width" &&
    failure.source.kind === "text" &&
    failure.source.text === name
      ? describeVanishedDetailCount(failure)
      : describeComponentFailure(failure),
  );

  // A left and right stud icon are frequently the very same icon at the same scale, so they fail
  // the same way (same counts): nothing is lost by only saying it once. Dedupes on the final
  // worded message, not the raw source, so it still keeps two icons apart the moment either
  // their id or their counts genuinely differ (user feedback: "si son los mismos no tiene
  // sentido duplicarlos").
  return [...new Set(messages)].join("\n");
};

export const computeFootprintMm = (shape: ShapeSpec): { width: number; height: number } => {
  if (shape.type === "disc") {
    return { width: shape.diameterMm, height: shape.diameterMm };
  }

  // A conservative square bounding box (not a tight fit) is enough to guarantee no overlap
  // on the plate; the exact silhouette isn't needed here.
  const spanMm = (computeOuterRadiusMm(shape) + computeEffectiveStudDiameterMm(shape) / 2) * 2;

  return { width: spanMm, height: spanMm };
};

export const handlePreview = async (request: PreviewRequest): Promise<PreviewResponse> => {
  const { font, loadIconSource } = await getResources();

  const results = await Promise.all(
    request.items.map(async (item) => {
      const printProfile = PRINT_PROFILES[item.spec.printProfileId];
      const result = await computeReliefComponents(item.spec, font, printProfile, loadIconSource);
      // IconOverflowBehavior "grow" (see types.ts): the base outline itself hugs any icon that
      // grew, so this preview matches the real mesh (buildArcTokenMesh.ts, buildTokenMesh.ts)
      // instead of showing a plain circle. Only known once the icons above are placed, hence
      // sequential rather than a Promise.all with computeReliefComponents.
      const growOutlineContours = result.reliefComponents.flatMap(
        (component) => component.growOutline ?? [],
      );
      const baseContours = await computeBaseOutlineContours(
        item.spec.shape,
        CENTER_ANGLE_DEG,
        growOutlineContours,
      );

      return {
        id: item.id,
        label: item.label,
        group: item.group,
        name: item.name,
        shape: item.spec.shape,
        baseContours,
        reliefComponents: result.reliefComponents,
        warnings: result.warnings,
        copies: item.copies,
        valid: result.valid,
        reason: describeReason(item.name, result.componentFailures),
      };
    }),
  );

  return {
    kind: "preview",
    requestId: request.requestId,
    results,
    validCount: results.filter((result) => result.valid).length,
    invalidCount: results.filter((result) => !result.valid).length,
  };
};

export const handleExport = async (request: ExportRequest): Promise<ExportResponse> => {
  const { font, loadIconSource } = await getResources();
  const failures: ExportFailureItem[] = [];

  const built = await Promise.all(
    request.items.map(async (item) => {
      const printProfile = PRINT_PROFILES[item.spec.printProfileId];
      const result = await computeReliefComponents(item.spec, font, printProfile, loadIconSource);

      if (result.blocksExport) {
        failures.push({
          id: item.id,
          label: item.label,
          reason: describeReason(item.name, result.componentFailures),
        });
      }

      const parts = await buildTokenParts(item.spec, result.reliefComponents);

      for (const part of parts) {
        if (part.manifold.status() !== "NoError") {
          failures.push({
            id: item.id,
            label: item.label,
            reason: `Invalid mesh (status: ${part.manifold.status()}).`,
          });
        }
      }

      return { item, parts };
    }),
  );

  if (failures.length > 0) {
    return { kind: "export", requestId: request.requestId, status: "failed", failures };
  }

  const layoutItems: PlateLayoutItem[] = built.map(({ item }) => ({
    shapeType: item.spec.shape.type,
    footprintMm: computeFootprintMm(item.spec.shape),
    copies: item.copies,
  }));
  const offsetsByItem = computePlateLayout(layoutItems, PLATE_SPACING_MM);

  const combinedItems: CombinedThreeMfItem[] = built.map(({ parts }, index) => ({
    parts,
    offsets: offsetsByItem[index],
  }));

  const modelXml = buildCombinedThreeMfModelXml(combinedItems, request.colorGroups);
  const archive = buildThreeMfArchive(modelXml);

  return { kind: "export", requestId: request.requestId, status: "ok", archive };
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    const response =
      request.kind === "preview" ? await handlePreview(request) : await handleExport(request);

    if (response.kind === "export" && response.status === "ok") {
      self.postMessage(response, [response.archive.buffer]);
      return;
    }

    self.postMessage(response);
  } catch (error) {
    const errorResponse: WorkerErrorResponse = {
      kind: "error",
      requestId: request.requestId,
      message: describeError(error),
    };

    self.postMessage(errorResponse);
  }
};
