import { useEffect, useMemo, useRef, useState } from "react";

import type { PreviewItem, WorkerRequest } from "@/browser/tokenWorker";
import type { GuildCatalog } from "@/core/token/catalog/catalogTypes";
import { buildTokenItems } from "@/core/token/catalog/token-items/buildTokenItems";
import type {
  SharedConfig,
  TokenSelection,
} from "@/core/token/catalog/token-items/tokenItem";

import { LIVE_PREVIEW_DEBOUNCE_MS } from "./livePreviewDebounce";
import { useWorker } from "./useWorker";

export const usePreview = (
  catalog: GuildCatalog | undefined,
  selection: TokenSelection,
  sharedConfig: SharedConfig,
) => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);

  const { workerRef, requestIdRef, pendingExportRef } = useWorker({
    setPreviewItems,
    setIsPreviewing,
  });

  const tokenItems = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return buildTokenItems(catalog, selection, sharedConfig);
  }, [catalog, selection, sharedConfig]);

  // When the most recent request was sent, so the effect below can tell an isolated change (a
  // single click, "Select all", a guild switch) from one that's part of a rapid-fire burst (a
  // dragged slider, a fast-typed number).
  const lastRequestSentAtRef = useRef(0);

  useEffect(() => {
    if (!workerRef.current || tokenItems.length === 0) {
      setPreviewItems([]);
      setIsPreviewing(false);
      return;
    }

    const requestId = ++requestIdRef.current;

    setIsPreviewing(true);

    const postPreviewRequest = () => {
      const request: WorkerRequest = {
        kind: "preview",
        requestId,
        items: tokenItems,
      };

      workerRef.current?.postMessage(request);
      lastRequestSentAtRef.current = Date.now();
    };

    const elapsedSinceLastRequestMs = Date.now() - lastRequestSentAtRef.current;

    // The first change after a quiet spell runs at once. Changes inside the debounce window wait
    // for it to end, so a burst runs once.
    if (elapsedSinceLastRequestMs >= LIVE_PREVIEW_DEBOUNCE_MS) {
      postPreviewRequest();
      return;
    }

    const remainingWaitMs =
      LIVE_PREVIEW_DEBOUNCE_MS - elapsedSinceLastRequestMs;
    const timeoutId = setTimeout(postPreviewRequest, remainingWaitMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [tokenItems, workerRef, requestIdRef]);

  const validCount = useMemo(
    () => previewItems.filter((item) => item.valid).length,
    [previewItems],
  );
  const invalidCount = previewItems.length - validCount;

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
