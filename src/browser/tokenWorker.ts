/// <reference lib="webworker" />
import { describeError } from "@/core/describeError";
import { buildTokenParts } from "@/core/token/buildTokenParts";
import type { TokenItem } from "@/core/token/catalog/token-items/tokenItem";
import { buildThreeMfArchive } from "@/core/token/export/three-mf/archive";
import {
  buildCombinedThreeMfModel,
  type CombinedThreeMfItem,
} from "@/core/token/export/three-mf/combinedModel";
import { CENTER_ANGLE_DEG } from "@/core/token/geometry/angleConventions";
import {
  computePlateLayout,
  type PlateLayoutItem,
} from "@/core/token/geometry/computePlateLayout";
import { computePartsBounds } from "@/core/token/mesh/computePartsBounds";
import {
  collectGrowOutlineContours,
  type ReliefComponent,
} from "@/core/token/mesh/reliefComponent";
import type { TokenPart } from "@/core/token/mesh/tokenPart";
import { computeBaseOutlineContours } from "@/core/token/preview/computeBaseOutlineContours";
import { PRINT_PROFILES } from "@/core/token/printProfiles";
import { computeReliefComponents } from "@/core/token/relief/computeReliefComponents";
import type { LoadIconSource } from "@/core/token/relief/computeReliefComponentsShared";
import type { ColorGroupSpec, ShapeSpec, Vec2 } from "@/core/token/types";
import { describeTokenFailures } from "@/core/token/validation/describeTokenFailures";

import { loadCatalogFont } from "./loadFont";
import { loadIconManifest } from "./loadIconManifest";
import { createLoadIconSource } from "./loadIconSource";

const PLATE_SPACING_MM = 10;

export type PreviewRequest = {
  kind: "preview";
  requestId: number;
  items: TokenItem[];
};
export type PreviewItem = Pick<
  TokenItem,
  "id" | "label" | "group" | "name" | "copies"
> & {
  shape: ShapeSpec;
  baseContours: Vec2[][];
  reliefComponents: ReliefComponent[];
  warnings: string[];
  valid: boolean;
  reason: string;
};
export type PreviewResponse = {
  kind: "preview";
  requestId: number;
  results: PreviewItem[];
};

export type ExportRequest = {
  kind: "export";
  requestId: number;
  items: TokenItem[];
  colorGroups: ColorGroupSpec[];
};
export type ExportFailureItem = Pick<TokenItem, "id" | "label"> & {
  reason: string;
};
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

export type WorkerErrorResponse = {
  kind: "error";
  requestId: number;
  message: string;
};

export type WorkerRequest = PreviewRequest | ExportRequest;
export type WorkerResponse =
  | PreviewResponse
  | ExportResponse
  | WorkerErrorResponse;

let resourcesPromise: ReturnType<typeof loadResources> | undefined;

// Fonts aren't here: each token loads only its own (see loadCatalogFont).
const loadResources = async () => {
  const manifest = await loadIconManifest();

  return { loadIconSource: createLoadIconSource(manifest) };
};

// A failed load is forgotten rather than cached, so a transient network error fails only the
// request that hit it and the next one tries again, instead of every request until a reload.
const getResources = () => {
  if (!resourcesPromise) {
    resourcesPromise = loadResources().catch((error: unknown) => {
      resourcesPromise = undefined;
      throw error;
    });
  }

  return resourcesPromise;
};

export const handlePreview = async (
  request: PreviewRequest,
): Promise<PreviewResponse> => {
  const { loadIconSource } = await getResources();

  const results = await Promise.all(
    request.items.map(async (item) => {
      const printProfile = PRINT_PROFILES[item.spec.printProfileId];
      const font = await loadCatalogFont(item.spec.fontId);
      const result = await computeReliefComponents(
        item.spec,
        font,
        printProfile,
        loadIconSource,
      );
      // After computeReliefComponents, not alongside it: the outline includes the footprints of
      // icons with behavior "grow", which exist only once the icons are placed.
      const growOutlineContours = collectGrowOutlineContours(
        result.reliefComponents,
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
        reason: describeTokenFailures(item.name, result.componentFailures),
      };
    }),
  );

  return {
    kind: "preview",
    requestId: request.requestId,
    results,
  };
};

type BuiltExportItem = { item: TokenItem; parts: TokenPart[] };

// One token's printable parts. Whatever keeps it from printing is added to failures.
const buildExportItem = async (
  item: TokenItem,
  loadIconSource: LoadIconSource,
  failures: ExportFailureItem[],
): Promise<BuiltExportItem> => {
  const printProfile = PRINT_PROFILES[item.spec.printProfileId];
  const font = await loadCatalogFont(item.spec.fontId);
  const result = await computeReliefComponents(
    item.spec,
    font,
    printProfile,
    loadIconSource,
  );

  if (result.blocksExport) {
    failures.push({
      id: item.id,
      label: item.label,
      reason: describeTokenFailures(item.name, result.componentFailures),
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
};

// Every built token laid out on one plate, packed into a 3MF archive.
const packThreeMfArchive = (
  built: BuiltExportItem[],
  colorGroups: ColorGroupSpec[],
): Uint8Array => {
  const layoutItems: PlateLayoutItem[] = built.map(({ item, parts }) => ({
    shapeType: item.spec.shape.type,
    boundsMm: computePartsBounds(parts),
    copies: item.copies,
  }));
  const offsetsByItem = computePlateLayout(layoutItems, PLATE_SPACING_MM);

  const combinedItems: CombinedThreeMfItem[] = built.map(
    ({ item, parts }, index) => ({
      name: item.label,
      parts,
      offsets: offsetsByItem[index],
    }),
  );

  const { modelXml, prusaModelConfigXml } = buildCombinedThreeMfModel(
    combinedItems,
    colorGroups,
  );

  return buildThreeMfArchive(modelXml, prusaModelConfigXml);
};

export const handleExport = async (
  request: ExportRequest,
): Promise<ExportResponse> => {
  const { loadIconSource } = await getResources();
  const failures: ExportFailureItem[] = [];

  const built = await Promise.all(
    request.items.map((item) =>
      buildExportItem(item, loadIconSource, failures),
    ),
  );

  if (failures.length > 0) {
    return {
      kind: "export",
      requestId: request.requestId,
      status: "failed",
      failures,
    };
  }

  return {
    kind: "export",
    requestId: request.requestId,
    status: "ok",
    archive: packThreeMfArchive(built, request.colorGroups),
  };
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    const response =
      request.kind === "preview"
        ? await handlePreview(request)
        : await handleExport(request);

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
