import { type RefObject, useEffect, useRef } from "react";

import type {
  ExportResponse,
  PreviewItem,
  WorkerResponse,
} from "@/browser/tokenWorker";

export type PendingExport = {
  requestId: number;
  resolve: (response: ExportResponse) => void;
  reject: (error: Error) => void;
};

// What a pending export is told when the worker goes away under it, so useExport stops waiting.
const WORKER_TERMINATED_MESSAGE =
  "The export was cancelled because the page closed its worker.";
// ErrorEvent.message can come back empty, e.g. for a worker script that failed to load.
const WORKER_FAILED_MESSAGE = "The token worker stopped unexpectedly.";

type UseWorkerOptions = {
  setPreviewItems: (items: PreviewItem[]) => void;
  setIsPreviewing: (isPreviewing: boolean) => void;
};

type PendingExportRef = RefObject<PendingExport | undefined>;

type ResponseHandlerOptions = UseWorkerOptions & {
  requestIdRef: RefObject<number>;
  pendingExportRef: PendingExportRef;
};

const rejectPendingExport = (
  pendingExportRef: PendingExportRef,
  message: string,
) => {
  pendingExportRef.current?.reject(new Error(message));
  pendingExportRef.current = undefined;
};

const isPendingExport = (
  pendingExportRef: PendingExportRef,
  requestId: number,
): boolean => pendingExportRef.current?.requestId === requestId;

// Routes each worker response to whoever is waiting on it: the latest preview, or the pending
// export with that request id.
const responseHandler =
  ({
    setPreviewItems,
    setIsPreviewing,
    requestIdRef,
    pendingExportRef,
  }: ResponseHandlerOptions) =>
  (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const isLatestRequest = response.requestId === requestIdRef.current;

    if (response.kind === "preview") {
      if (!isLatestRequest) {
        return;
      }

      setPreviewItems(response.results);
      setIsPreviewing(false);
      return;
    }

    const awaitedByExport = isPendingExport(
      pendingExportRef,
      response.requestId,
    );

    if (response.kind === "error") {
      if (awaitedByExport) {
        rejectPendingExport(pendingExportRef, response.message);
        return;
      }

      if (isLatestRequest) {
        setIsPreviewing(false);
      }
      return;
    }

    if (awaitedByExport) {
      pendingExportRef.current?.resolve(response);
      pendingExportRef.current = undefined;
    }
  };

// The one worker shared by preview and export. Both draw request ids from the same counter, so a
// preview response is applied only if no newer request went out since. An export response goes
// to the pending export with its id, which is awaiting that exact response.
export const useWorker = ({
  setPreviewItems,
  setIsPreviewing,
}: UseWorkerOptions) => {
  const workerRef = useRef<Worker | undefined>(undefined);
  const requestIdRef = useRef(0);
  const pendingExportRef = useRef<PendingExport | undefined>(undefined);

  useEffect(() => {
    const worker = new Worker(
      new URL("../browser/tokenWorker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    worker.onmessage = responseHandler({
      setPreviewItems,
      setIsPreviewing,
      requestIdRef,
      pendingExportRef,
    });

    // The worker script itself failed (it never loaded, or threw outside a request), so no
    // response is ever coming: settle whatever was waiting on one instead of spinning forever.
    worker.onerror = (event: ErrorEvent) => {
      rejectPendingExport(
        pendingExportRef,
        event.message || WORKER_FAILED_MESSAGE,
      );
      setIsPreviewing(false);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      rejectPendingExport(pendingExportRef, WORKER_TERMINATED_MESSAGE);
    };
  }, [setPreviewItems, setIsPreviewing]);

  return { workerRef, requestIdRef, pendingExportRef };
};
