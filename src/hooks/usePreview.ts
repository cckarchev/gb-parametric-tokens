import { useEffect, useMemo, useState } from "react";

import type { WorkerRequest } from "../browser/tokenWorker";
import {
  buildTokenItems,
  SharedConfig,
  TokenSelection,
} from "../core/token/catalog/buildTokenItems";
import { GuildCatalog } from "../core/token/catalog/catalogTypes";
import { LIVE_PREVIEW_DEBOUNCE_MS } from "./livePreviewDebounce";
import { PreviewItem, useWorker } from "./useWorker";

export type { PreviewItem };

export const usePreview = (
  catalog: GuildCatalog | undefined,
  selection: TokenSelection,
  sharedConfig: SharedConfig,
) => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  const { workerRef, requestIdRef, pendingExportRef } = useWorker({
    setPreviewItems,
    setValidCount,
    setInvalidCount,
    setIsPreviewing,
  });

  const tokenItems = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return buildTokenItems(catalog, selection, sharedConfig);
  }, [catalog, selection, sharedConfig]);

  useEffect(() => {
    if (!workerRef.current || tokenItems.length === 0) {
      setPreviewItems([]);
      setValidCount(0);
      setInvalidCount(0);
      return;
    }

    const requestId = ++requestIdRef.current;

    setIsPreviewing(true);

    const timeoutId = setTimeout(() => {
      const request: WorkerRequest = {
        kind: "preview",
        requestId,
        items: tokenItems,
      };

      workerRef.current?.postMessage(request);
    }, LIVE_PREVIEW_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [tokenItems]);

  return {
    tokenItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    workerRef,
    requestIdRef,
    pendingExportRef,
  };
};
