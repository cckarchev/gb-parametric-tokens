import { useEffect, useRef } from "react";

import type { ExportResponse, PreviewItem, WorkerResponse } from "@/browser/tokenWorker";

export type PendingExport = {
  requestId: number;
  resolve: (response: ExportResponse) => void;
  reject: (error: Error) => void;
};

// What a pending export is told when the worker goes away under it, so useExport stops waiting.
const WORKER_TERMINATED_MESSAGE = "The export was cancelled because the page closed its worker.";
// ErrorEvent.message can come back empty, e.g. for a worker script that failed to load.
const WORKER_FAILED_MESSAGE = "The token worker stopped unexpectedly.";

type UseWorkerOptions = {
  setPreviewItems: (items: PreviewItem[]) => void;
  setIsPreviewing: (isPreviewing: boolean) => void;
};

// The one worker shared by preview and export. Both draw request ids from the same counter, so a
// preview response is applied only if no newer request went out since. An export response goes
// to the pending export with its id, which is awaiting that exact response.
export const useWorker = ({ setPreviewItems, setIsPreviewing }: UseWorkerOptions) => {
  const workerRef = useRef<Worker | undefined>(undefined);
  const requestIdRef = useRef(0);
  const pendingExportRef = useRef<PendingExport | undefined>(undefined);

  const rejectPendingExport = (message: string) => {
    pendingExportRef.current?.reject(new Error(message));
    pendingExportRef.current = undefined;
  };

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
          rejectPendingExport(response.message);
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

    // The worker script itself failed (it never loaded, or threw outside a request), so no
    // response is ever coming: settle whatever was waiting on one instead of spinning forever.
    worker.onerror = (event: ErrorEvent) => {
      rejectPendingExport(event.message || WORKER_FAILED_MESSAGE);
      setIsPreviewing(false);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      rejectPendingExport(WORKER_TERMINATED_MESSAGE);
    };
  }, [setPreviewItems, setIsPreviewing]);

  return { workerRef, requestIdRef, pendingExportRef };
};
