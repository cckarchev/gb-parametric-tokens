import { useEffect, useRef } from "react";

import type { ExportResponse, PreviewItem, WorkerResponse } from "@/browser/tokenWorker";

export type { PreviewItem };

export type PendingExport = {
  requestId: number;
  resolve: (response: ExportResponse) => void;
  reject: (error: Error) => void;
};

type UseWorkerOptions = {
  setPreviewItems: (items: PreviewItem[]) => void;
  setIsPreviewing: (isPreviewing: boolean) => void;
};

// Owns the one worker instance shared by both the preview flow and the export flow: every
// request, whichever flow issues it, draws from the same incrementing requestId (requestIdRef),
// so a preview response only gets applied if nothing newer (another preview request or an
// export request) has been issued since. Export responses are routed by matching
// pendingExportRef instead, since exportThreeMf needs to await a specific response rather than just
// watch the latest one.
export const useWorker = ({ setPreviewItems, setIsPreviewing }: UseWorkerOptions) => {
  const workerRef = useRef<Worker | undefined>(undefined);
  const requestIdRef = useRef(0);
  const pendingExportRef = useRef<PendingExport | undefined>(undefined);

  useEffect(() => {
    const worker = new Worker(new URL("../browser/tokenWorker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;

      if (response.kind === "preview") {
        if (response.requestId !== requestIdRef.current) {
          return;
        }

        setPreviewItems(response.results);
        setIsPreviewing(false);
        return;
      }

      if (response.kind === "error") {
        if (pendingExportRef.current && pendingExportRef.current.requestId === response.requestId) {
          pendingExportRef.current.reject(new Error(response.message));
          pendingExportRef.current = undefined;
          return;
        }

        if (response.requestId === requestIdRef.current) {
          setIsPreviewing(false);
        }
        return;
      }

      if (pendingExportRef.current && pendingExportRef.current.requestId === response.requestId) {
        pendingExportRef.current.resolve(response);
        pendingExportRef.current = undefined;
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, [setPreviewItems, setIsPreviewing]);

  return { workerRef, requestIdRef, pendingExportRef };
};
