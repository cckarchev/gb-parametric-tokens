import { useCallback, useEffect, useState } from "react";

import { downloadBlob } from "@/browser/downloadBlob";
import { describeError } from "@/core/describeError";
import type { GuildCatalog } from "@/core/token/catalog/catalogTypes";
import { deriveReliefColor } from "@/core/token/catalog/deriveReliefColor";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/token-items/defaultSharedConfig";
import { parseSettingsFile } from "@/core/token/catalog/token-items/parseSettingsFile";
import type { SharedConfig } from "@/core/token/catalog/token-items/tokenItem";
import {
  BASE_COLOR_GROUP_ID,
  TEXT_COLOR_GROUP_ID,
} from "@/core/token/mesh/colorGroups";

const SETTINGS_FILE_NAME = "token-settings.json";
const JSON_MIME_TYPE = "application/json";
const SETTINGS_JSON_INDENT = 2;

// The settings every token shares, plus saving them to and loading them from a JSON file.
export const useSharedConfig = (catalog: GuildCatalog | undefined) => {
  const [importSettingsError, setImportSettingsError] = useState<string>();

  const [sharedConfig, setSharedConfig] = useState<SharedConfig>(
    DEFAULT_SHARED_CONFIG,
  );

  // Every successful guild load re-seeds the two catalog-derived colors (the selection itself is
  // kept per guild, and is not reset here).
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
    sharedConfig,
    setSharedConfig,
    exportSettingsJson,
    importSettingsJson,
    importSettingsError,
  };
};
