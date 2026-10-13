import { useEffect, useMemo, useRef, useState } from "react";

import type { WorkerRequest } from "@/browser/tokenWorker";
import { GuildCatalog } from "@/core/token/catalog/catalogTypes";
import { buildTokenItems } from "@/core/token/catalog/tokenItems/buildTokenItems";
import { SharedConfig, TokenSelection } from "@/core/token/catalog/tokenItems/tokenItem";

import { LIVE_PREVIEW_DEBOUNCE_MS } from "./livePreviewDebounce";
import { PreviewItem, useWorker } from "./useWorker";

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

  // When the most recent request was sent, so the effect below can tell an isolated change (a
  // single click, "Select all", a guild switch) from one that's part of a rapid-fire burst (a
  // dragged slider, a fast-typed number).
  const lastRequestSentAtRef = useRef(0);

  useEffect(() => {
    if (!workerRef.current || tokenItems.length === 0) {
      setPreviewItems([]);
      setValidCount(0);
      setInvalidCount(0);
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

    // Leading edge: nothing else fired recently, so there's no burst to protect the worker from
    // -- run this (possibly large) recompute right away instead of padding it with an artificial
    // wait. Trailing edge: something fired within the debounce window already, so this change
    // waits out the remainder of that window, coalescing the burst into one recompute instead of
    // one per event.
    if (elapsedSinceLastRequestMs >= LIVE_PREVIEW_DEBOUNCE_MS) {
      postPreviewRequest();
      return;
    }

    const remainingWaitMs = LIVE_PREVIEW_DEBOUNCE_MS - elapsedSinceLastRequestMs;
    const timeoutId = setTimeout(postPreviewRequest, remainingWaitMs);

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
