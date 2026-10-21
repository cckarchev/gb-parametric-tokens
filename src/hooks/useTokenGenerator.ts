import { useMemo } from "react";

import { useExport } from "./useExport";
import { useGuildCatalog } from "./useGuildCatalog";
import { useGuildSelections } from "./useGuildSelections";
import { usePreview } from "./usePreview";
import { useSharedConfig } from "./useSharedConfig";

export const useTokenGenerator = () => {
  const guildCatalog = useGuildCatalog();
  const { catalog, selectedGuildId } = guildCatalog;

  const guildSelections = useGuildSelections(catalog, selectedGuildId);
  const settings = useSharedConfig(catalog);

  const {
    tokenItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    workerRef,
    requestIdRef,
    pendingExportRef,
  } = usePreview(catalog, guildSelections.selection, settings.sharedConfig);

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

  const tokenExport = useExport(
    workerRef,
    requestIdRef,
    pendingExportRef,
    tokenItems,
    catalog?.name,
    settings.sharedConfig,
  );

  // The worker refs stay in here: only the preview's own results go out.
  return {
    ...guildCatalog,
    ...guildSelections,
    ...settings,
    tokenItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    invalidPreviewItems,
    ...tokenExport,
  };
};
