import { useCallback, useEffect, useMemo, useState } from "react";

import { downloadBlob } from "../browser/downloadBlob";
import { buildDefaultSelection } from "../core/token/catalog/buildDefaultSelection";
import { SharedConfig, TokenSelection } from "../core/token/catalog/buildTokenItems";
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
import { useExport } from "./useExport";
import { useGuildCatalog } from "./useGuildCatalog";
import { usePreview } from "./usePreview";

export type { PreviewItem } from "./useWorker";

// Placeholder for influenceIconId before any guild has loaded (selectGuild overwrites it with
// the guild's own icon id). "blank" is a real icon in the manifest, so this never substitutes.
const FALLBACK_ICON_ID = "blank";

const DEFAULT_GOAL_INFLUENCE_SHAPE: SharedConfig["goalInfluenceShape"] = {
  type: "disc",
  diameterMm: 20,
};
// Measured against the real DEFAULT_ARC_SHAPE's 6mm band via the real pipeline
// (computeReliefComponents): the largest sizes that fit a two-line label like "Command" /
// "-2/-2 MOV" without truncating or overlapping the ribbon edges.
const DEFAULT_TITLE_SIZE_MM = 3;
const DEFAULT_SUBTITLE_SIZE_MM = 1.9;

const SETTINGS_FILE_NAME = "token-settings.json";
const JSON_MIME_TYPE = "application/json";

// The fine-tuning settings (shapes, style, fit policy, colors...) live separately from the
// per-run token selection, so they can be shared/reused across runs independently of which
// tokens a given download happens to include.
const isSharedConfig = (value: unknown): value is SharedConfig => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SharedConfig>;

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
    typeof candidate.subtitleSizeMm === "number" &&
    typeof candidate.showSecondLine === "boolean" &&
    typeof candidate.balanceTwoLineSizes === "boolean"
  );
};

// Rendered only before any guild has been selected (TokenEditor gates every consumer of
// `selection` behind `generator.catalog &&`), so its actual values are never seen -- it exists
// purely so `selection` can stay a plain TokenSelection instead of TokenSelection | undefined.
const NO_GUILD_SELECTED: TokenSelection = {
  characterTokenIds: [],
  characterTokenCopies: {},
  genericTokens: {},
  influence: { enabled: false, copies: 1 },
  momentum: { enabled: false, copies: 1 },
  goalInfluence: { enabled: false, copies: 1 },
};

type SelectionUpdate = TokenSelection | ((current: TokenSelection) => TokenSelection);

export const useTokenGenerator = () => {
  const { guilds, selectedGuildId, selectGuild, catalog, catalogStatus, catalogError } =
    useGuildCatalog();

  // Selections live per guild, keyed by guildId, so switching guilds never loses what the user
  // chose for the one they're leaving. A guild with no entry yet (first visit) falls back to
  // defaultSelection below, so the map only needs to gain an entry once the user actually
  // changes something -- an untouched guild reproduces the same default either way.
  const [selectionsByGuild, setSelectionsByGuild] = useState<Record<string, TokenSelection>>({});

  // Memoized on `catalog` (not recomputed on every render): usePreview's own tokenItems memo
  // depends on `selection`'s identity, so an untouched guild's fallback has to stay
  // referentially stable across renders. A fresh object here on every render used to look like a
  // brand new selection on every render, which kept re-triggering the preview worker forever the
  // moment anything else caused a re-render (e.g. the worker's own response coming back).
  const defaultSelection = useMemo(
    () => (catalog ? buildDefaultSelection(catalog) : NO_GUILD_SELECTED),
    [catalog],
  );

  const selection =
    selectedGuildId !== undefined
      ? (selectionsByGuild[selectedGuildId] ?? defaultSelection)
      : NO_GUILD_SELECTED;

  const setSelection = useCallback(
    (update: SelectionUpdate) => {
      if (!catalog || !selectedGuildId) {
        return;
      }

      const guildId = selectedGuildId;

      setSelectionsByGuild((current) => {
        const currentSelection = current[guildId] ?? defaultSelection;
        const nextSelection = typeof update === "function" ? update(currentSelection) : update;

        return { ...current, [guildId]: nextSelection };
      });
    },
    [catalog, selectedGuildId, defaultSelection],
  );

  const [importSettingsError, setImportSettingsError] = useState<string>();

  const [sharedConfig, setSharedConfig] = useState<SharedConfig>({
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
    showSecondLine: true,
    balanceTwoLineSizes: false,
    shrinkIconsToFitCircle: false,
  });

  // Every successful guild load re-seeds the two catalog-derived colors (the selection itself is
  // handled above, per guild, and is not reset here).
  useEffect(() => {
    if (!catalog) {
      return;
    }

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
    tokenItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    workerRef,
    requestIdRef,
    pendingExportRef,
  } = usePreview(catalog, selection, sharedConfig);

  const invalidPreviewItems = useMemo(
    () =>
      previewItems
        .filter((item) => !item.valid)
        .map((item) => ({
          id: item.id,
          group: item.group,
          title: item.title,
          reason: item.reason,
        })),
    [previewItems],
  );

  const { isExporting, exportError, exportFailures, exportThreeMf } = useExport(
    workerRef,
    requestIdRef,
    pendingExportRef,
    tokenItems,
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

      if (!isSharedConfig(parsed)) {
        throw new Error("This file is not a valid settings file.");
      }

      // Not validated above: a settings file exported before this option existed simply lacks
      // it, and should still import cleanly, defaulting to off rather than being rejected.
      setSharedConfig({
        ...parsed,
        shrinkIconsToFitCircle: parsed.shrinkIconsToFitCircle ?? false,
      });
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
    tokenItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    invalidPreviewItems,
    isExporting,
    exportError,
    exportFailures,
    exportThreeMf,
    exportSettingsJson,
    importSettingsJson,
    importSettingsError,
  };
};
