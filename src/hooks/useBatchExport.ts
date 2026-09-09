import { useCallback, useState } from "react";

import type {
  BatchExportFailureItem,
  BatchExportResponse,
  BatchWorkerRequest,
} from "../browser/batchWorker";
import { downloadBlob } from "../browser/downloadBlob";
import { BatchItem, BatchSharedConfig } from "../core/token/catalog/buildBatchItems";
import { PendingExport } from "./useBatchWorker";

const THREE_MF_MIME_TYPE = "model/3mf";

export const useBatchExport = (
  workerRef: { current: Worker | undefined },
  requestIdRef: { current: number },
  pendingExportRef: { current: PendingExport | undefined },
  batchItems: BatchItem[],
  guildName: string | undefined,
  sharedConfig: BatchSharedConfig,
) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const [exportFailures, setExportFailures] = useState<BatchExportFailureItem[]>([]);

  const exportThreeMf = useCallback(async () => {
    if (!workerRef.current || batchItems.length === 0) {
      return;
    }

    setExportError(undefined);
    setExportFailures([]);
    setIsExporting(true);

    const requestId = ++requestIdRef.current;

    try {
      const response = await new Promise<BatchExportResponse>((resolve, reject) => {
        pendingExportRef.current = { requestId, resolve, reject };

        const request: BatchWorkerRequest = {
          kind: "export",
          requestId,
          items: batchItems,
          colorGroups: sharedConfig.colorGroups,
        };

        workerRef.current?.postMessage(request);
      });

      if (response.status === "failed") {
        setExportFailures(response.failures);
        return;
      }

      downloadBlob(response.archive, `${guildName ?? "batch"}.3mf`, THREE_MF_MIME_TYPE);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExporting(false);
    }
  }, [batchItems, guildName, sharedConfig]);

  return { isExporting, exportError, exportFailures, exportThreeMf };
};
