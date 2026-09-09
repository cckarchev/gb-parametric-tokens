/// <reference lib="webworker" />
import { buildTokenParts } from "../core/token/buildTokenParts";
import { TokenItem } from "../core/token/catalog/buildTokenItems";
import { computeReliefComponents } from "../core/token/computeReliefComponents";
import {
  buildCombinedThreeMfModelXml,
  CombinedThreeMfItem,
} from "../core/token/export/combinedThreeMfModel";
import { buildThreeMfArchive } from "../core/token/export/threeMfArchive";
import { CENTER_ANGLE_DEG } from "../core/token/geometry/angleConventions";
import { computePlateLayout, PlateLayoutItem } from "../core/token/geometry/computePlateLayout";
import {
  computeEffectiveNobDiameterMm,
  computeOuterRadiusMm,
} from "../core/token/geometry/nobPlacement";
import { ReliefComponent } from "../core/token/mesh/reliefComponent";
import { computeBaseOutlineContours } from "../core/token/preview/computeBaseOutlineContours";
import { PRINT_PROFILES } from "../core/token/printProfiles";
import { ColorGroupSpec, ShapeSpec } from "../core/token/types";
import { loadFont } from "./loadFont";
import { loadIconManifest } from "./loadIconManifest";
import { createLoadIconSource } from "./loadIconSource";

const PLATE_SPACING_MM = 10;

export type PreviewRequest = { kind: "preview"; requestId: number; items: TokenItem[] };
export type PreviewItem = {
  id: string;
  label: string;
  shape: ShapeSpec;
  baseContours: [number, number][][];
  reliefComponents: ReliefComponent[];
  warnings: string[];
  copies: number;
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

export const computeFootprintMm = (shape: ShapeSpec): { width: number; height: number } => {
  if (shape.type === "disc") {
    return { width: shape.diameterMm, height: shape.diameterMm };
  }

  // A conservative square bounding box (not a tight fit) is enough to guarantee no overlap
  // on the plate; the exact silhouette isn't needed here.
  const spanMm = (computeOuterRadiusMm(shape) + computeEffectiveNobDiameterMm(shape) / 2) * 2;

  return { width: spanMm, height: spanMm };
};

export const handlePreview = async (request: PreviewRequest): Promise<PreviewResponse> => {
  const { font, loadIconSource } = await getResources();

  const results = await Promise.all(
    request.items.map(async (item) => {
      const printProfile = PRINT_PROFILES[item.spec.printProfileId];
      const [result, baseContours] = await Promise.all([
        computeReliefComponents(item.spec, font, printProfile, loadIconSource),
        computeBaseOutlineContours(item.spec.shape, CENTER_ANGLE_DEG),
      ]);

      return {
        id: item.id,
        label: item.label,
        shape: item.spec.shape,
        baseContours,
        reliefComponents: result.reliefComponents,
        warnings: result.warnings,
        copies: item.copies,
        valid: result.validation.valid,
      };
    }),
  );

  return {
    kind: "preview",
    requestId: request.requestId,
    results: results.map(({ valid, ...rest }) => rest),
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

      if (!result.validation.valid) {
        failures.push({
          id: item.id,
          label: item.label,
          reason: "Fails the minimum stroke width check.",
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

  const layoutItems: PlateLayoutItem[] = built.map(({ item, parts: _parts }) => ({
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
    const message = error instanceof Error ? error.message : String(error);
    const errorResponse: WorkerErrorResponse = {
      kind: "error",
      requestId: request.requestId,
      message,
    };

    self.postMessage(errorResponse);
  }
};
