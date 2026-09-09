import { useCallback, useEffect, useState } from "react";

import { downloadBlob } from "../browser/downloadBlob";
import { BatchSelection, BatchSharedConfig } from "../core/token/catalog/buildBatchItems";
import { deriveReliefColor, TEXT_COLOR_GROUP_ID } from "../core/token/catalog/deriveReliefColor";
import {
  DEFAULT_ARC_SHAPE,
  DEFAULT_COLOR_GROUPS,
  DEFAULT_DISC_SHAPE,
  DEFAULT_FIT_POLICY,
  DEFAULT_STYLE,
} from "../core/token/defaultShapeAndStyle";
import { BASE_COLOR_GROUP_ID } from "../core/token/mesh/colorGroups";
import { DEFAULT_PRINT_PROFILE_ID } from "../core/token/printProfiles";
import { useBatchExport } from "./useBatchExport";
import { useBatchPreview } from "./useBatchPreview";
import { useGuildCatalog } from "./useGuildCatalog";

export type { BatchPreviewItem } from "./useBatchWorker";

// Placeholder for influenceIconId before any guild has loaded (selectGuild overwrites it with
// the guild's own icon id). "blank" is a real icon in the manifest, so this never substitutes.
const FALLBACK_ICON_ID = "blank";

const DEFAULT_GOAL_INFLUENCE_SHAPE: BatchSharedConfig["goalInfluenceShape"] = {
  type: "disc",
  diameterMm: 20,
};
// Measured against the real DEFAULT_ARC_SHAPE's 6mm band via the real pipeline
// (computeReliefComponents): the largest sizes that fit a two-line label like "Command" /
// "-2/-2 MOV" without truncating or overlapping the ribbon edges.
const DEFAULT_TITLE_SIZE_MM = 3;
const DEFAULT_SUBTITLE_SIZE_MM = 1.9;

// Every counter's starting copies count, before its checkbox is ever touched (user feedback: a
// typical Guild Ball game's own real quantities, not just each field's bare minimum).
const DEFAULT_INFLUENCE_COPIES = 13;
const DEFAULT_MOMENTUM_COPIES = 15;
const DEFAULT_GOAL_INFLUENCE_COPIES = 2;

// Every token starts deselected: the user opts in to what they actually want printed, rather
// than starting from "everything" and having to deselect what they don't need.
const buildDefaultSelection = (): BatchSelection => ({
  characterTokenIds: [],
  characterTokenCopies: {},
  genericTokens: {},
  influence: { enabled: false, copies: DEFAULT_INFLUENCE_COPIES },
  momentum: { enabled: false, copies: DEFAULT_MOMENTUM_COPIES },
  goalInfluence: { enabled: false, copies: DEFAULT_GOAL_INFLUENCE_COPIES },
});

const SETTINGS_FILE_NAME = "batch-settings.json";
const JSON_MIME_TYPE = "application/json";

// The fine-tuning settings (shapes, style, fit policy, colors...) live separately from the
// per-run token selection, so they can be shared/reused across batches independently of which
// tokens a given download happens to include.
const isBatchSharedConfig = (value: unknown): value is BatchSharedConfig => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<BatchSharedConfig>;

  return (
    typeof candidate.arcShape === "object" &&
    typeof candidate.discShape === "object" &&
    typeof candidate.goalInfluenceShape === "object" &&
    typeof candidate.style === "object" &&
    typeof candidate.fitPolicy === "object" &&
    typeof candidate.printProfileId === "string" &&
    Array.isArray(candidate.colorGroups) &&
    typeof candidate.influenceIconId === "string" &&
    typeof candidate.titleSizeMm === "number" &&
    typeof candidate.subtitleSizeMm === "number"
  );
};

export const useBatch = () => {
  const { guilds, selectedGuildId, selectGuild, catalog, catalogStatus, catalogError } =
    useGuildCatalog();

  const [selection, setSelection] = useState<BatchSelection>(buildDefaultSelection());
  const [importSettingsError, setImportSettingsError] = useState<string>();

  const [sharedConfig, setSharedConfig] = useState<BatchSharedConfig>({
    arcShape: DEFAULT_ARC_SHAPE,
    discShape: DEFAULT_DISC_SHAPE,
    goalInfluenceShape: DEFAULT_GOAL_INFLUENCE_SHAPE,
    style: DEFAULT_STYLE,
    fitPolicy: DEFAULT_FIT_POLICY,
    printProfileId: DEFAULT_PRINT_PROFILE_ID,
    colorGroups: DEFAULT_COLOR_GROUPS,
    influenceIconId: FALLBACK_ICON_ID,
    titleSizeMm: DEFAULT_TITLE_SIZE_MM,
    subtitleSizeMm: DEFAULT_SUBTITLE_SIZE_MM,
  });

  // Every successful guild load resets the selection back to "nothing selected" and seeds the
  // two catalog-derived colors. Keying off `catalog`'s own identity (a fresh object every load)
  // reproduces that reset reliably, since loadGuildCatalog never returns a cached object.
  useEffect(() => {
    if (!catalog) {
      return;
    }

    setSelection(buildDefaultSelection());
    setSharedConfig((current) => ({
      ...current,
      influenceIconId: catalog.name,
      colorGroups: [
        { id: BASE_COLOR_GROUP_ID, name: "Body", color: catalog.color },
        {
          id: TEXT_COLOR_GROUP_ID,
          name: "Text & symbols",
          color: deriveReliefColor(catalog.color),
        },
      ],
    }));
  }, [catalog]);

  const {
    batchItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    workerRef,
    requestIdRef,
    pendingExportRef,
  } = useBatchPreview(catalog, selection, sharedConfig);

  const { isExporting, exportError, exportFailures, exportThreeMf } = useBatchExport(
    workerRef,
    requestIdRef,
    pendingExportRef,
    batchItems,
    catalog?.name,
    sharedConfig,
  );

  const exportSettingsJson = useCallback(() => {
    const json = JSON.stringify(sharedConfig, null, 2);

    downloadBlob(json, SETTINGS_FILE_NAME, JSON_MIME_TYPE);
  }, [sharedConfig]);

  const importSettingsJson = useCallback(async (file: File) => {
    setImportSettingsError(undefined);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!isBatchSharedConfig(parsed)) {
        throw new Error("This file is not a valid batch settings file.");
      }

      setSharedConfig(parsed);
    } catch (error) {
      setImportSettingsError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  return {
    guilds,
    selectedGuildId,
    selectGuild,
    catalog,
    catalogStatus,
    catalogError,
    selection,
    setSelection,
    sharedConfig,
    setSharedConfig,
    batchItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    isExporting,
    exportError,
    exportFailures,
    exportThreeMf,
    exportSettingsJson,
    importSettingsJson,
    importSettingsError,
  };
};
