import { useCallback, useEffect, useMemo, useState } from "react";

import { downloadBlob } from "@/browser/downloadBlob";
import { describeError } from "@/core/describeError";
import { buildDefaultSelection } from "@/core/token/catalog/buildDefaultSelection";
import { deriveReliefColor } from "@/core/token/catalog/deriveReliefColor";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/token-items/defaultSharedConfig";
import { parseSettingsFile } from "@/core/token/catalog/token-items/parseSettingsFile";
import {
  DISABLED_COUNTER,
  SharedConfig,
  TokenSelection,
} from "@/core/token/catalog/token-items/tokenItem";
import { BASE_COLOR_GROUP_ID, TEXT_COLOR_GROUP_ID } from "@/core/token/mesh/colorGroups";

import { useExport } from "./useExport";
import { useGuildCatalog } from "./useGuildCatalog";
import { usePreview } from "./usePreview";

const SETTINGS_FILE_NAME = "token-settings.json";
const JSON_MIME_TYPE = "application/json";
const SETTINGS_JSON_INDENT = 2;

// Rendered only before any guild has been selected (TokenEditor gates every consumer of
// `selection` behind `generator.catalog &&`), so its actual values are never seen: it exists
// purely so `selection` can stay a plain TokenSelection instead of TokenSelection | undefined.
const NO_GUILD_SELECTED: TokenSelection = {
  characterTokenIds: [],
  characterTokenCopies: {},
  genericTokens: {},
  influence: DISABLED_COUNTER,
  momentum: DISABLED_COUNTER,
  goalInfluence: DISABLED_COUNTER,
  conditions: {},
  gamePlans: {},
};

type SelectionUpdate = TokenSelection | ((current: TokenSelection) => TokenSelection);

export const useTokenGenerator = () => {
  const { guilds, selectedGuildId, selectGuild, catalog, catalogStatus, catalogError } =
    useGuildCatalog();

  // Selections live per guild, keyed by guildId, so switching guilds never loses what the user
  // chose for the one they're leaving. A guild with no entry yet (first visit) falls back to
  // defaultSelection below, so the map only needs to gain an entry once the user actually
  // changes something: an untouched guild reproduces the same default either way.
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

  const [sharedConfig, setSharedConfig] = useState<SharedConfig>(DEFAULT_SHARED_CONFIG);

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
          name: "Details",
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
          name: item.name,
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
    const json = JSON.stringify(sharedConfig, null, SETTINGS_JSON_INDENT);

    downloadBlob(json, SETTINGS_FILE_NAME, JSON_MIME_TYPE);
  }, [sharedConfig]);

  const importSettingsJson = useCallback(async (file: File) => {
    setImportSettingsError(undefined);

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      setSharedConfig(parseSettingsFile(parsed));
    } catch (error) {
      setImportSettingsError(describeError(error));
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
