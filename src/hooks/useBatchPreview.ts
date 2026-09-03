import { useEffect, useMemo, useState } from "react";

import type { BatchWorkerRequest } from "../browser/batchWorker";
import {
  BatchSelection,
  BatchSharedConfig,
  buildBatchItems,
} from "../core/token/catalog/buildBatchItems";
import { GuildCatalog } from "../core/token/catalog/catalogTypes";
import { LIVE_PREVIEW_DEBOUNCE_MS } from "./livePreviewDebounce";
import { BatchPreviewItem, buildWorkerItems, useBatchWorker } from "./useBatchWorker";

export type { BatchPreviewItem };

export const useBatchPreview = (
  catalog: GuildCatalog | undefined,
  selection: BatchSelection,
  sharedConfig: BatchSharedConfig,
) => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewItems, setPreviewItems] = useState<BatchPreviewItem[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  const { workerRef, requestIdRef, pendingExportRef } = useBatchWorker({
    setPreviewItems,
    setValidCount,
    setInvalidCount,
    setIsPreviewing,
  });

  const batchItems = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return buildBatchItems(catalog, selection, sharedConfig);
  }, [catalog, selection, sharedConfig]);

  useEffect(() => {
    if (!workerRef.current || batchItems.length === 0) {
      setPreviewItems([]);
      setValidCount(0);
      setInvalidCount(0);
      return;
    }

    const requestId = ++requestIdRef.current;

    setIsPreviewing(true);

    const timeoutId = setTimeout(() => {
      const request: BatchWorkerRequest = {
        kind: "preview",
        requestId,
        items: buildWorkerItems(batchItems),
      };

      workerRef.current?.postMessage(request);
    }, LIVE_PREVIEW_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [batchItems]);

  return {
    batchItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    workerRef,
    requestIdRef,
    pendingExportRef,
  };
};
