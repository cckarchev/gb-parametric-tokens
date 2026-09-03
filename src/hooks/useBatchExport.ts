import { zipSync } from "fflate";
import { useCallback, useState } from "react";

import type {
  BatchExportFailureItem,
  BatchExportResponse,
  BatchWorkerRequest,
} from "../browser/batchWorker";
import { downloadBlob } from "../browser/downloadBlob";
import {
  BatchItem,
  BatchSelection,
  BatchSharedConfig,
} from "../core/token/catalog/buildBatchItems";
import { buildWorkerItems, PendingExport } from "./useBatchWorker";

const THREE_MF_FILE_NAME = "batch.3mf";
const SPEC_FILE_NAME = "batch-spec.json";
const ZIP_FILE_NAME = "batch.zip";
const ZIP_MIME_TYPE = "application/zip";

export const useBatchExport = (
  workerRef: { current: Worker | undefined },
  requestIdRef: { current: number },
  pendingExportRef: { current: PendingExport | undefined },
  batchItems: BatchItem[],
  selection: BatchSelection,
  sharedConfig: BatchSharedConfig,
) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const [exportFailures, setExportFailures] = useState<BatchExportFailureItem[]>([]);

  const exportZip = useCallback(async () => {
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
          items: buildWorkerItems(batchItems),
          colorGroups: sharedConfig.colorGroups,
        };

        workerRef.current?.postMessage(request);
      });

      if (response.status === "failed") {
        setExportFailures(response.failures);
        return;
      }

      const encoder = new TextEncoder();
      const specJson = JSON.stringify({ selection, sharedConfig }, null, 2);
      const zipBytes = zipSync({
        [THREE_MF_FILE_NAME]: response.archive,
        [SPEC_FILE_NAME]: encoder.encode(specJson),
      });

      downloadBlob(zipBytes, ZIP_FILE_NAME, ZIP_MIME_TYPE);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExporting(false);
    }
  }, [batchItems, selection, sharedConfig]);

  return { isExporting, exportError, exportFailures, exportZip };
};
