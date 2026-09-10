import { useCallback, useState } from "react";

import { downloadBlob } from "../browser/downloadBlob";
import type { ExportFailureItem, ExportResponse, WorkerRequest } from "../browser/tokenWorker";
import { SharedConfig, TokenItem } from "../core/token/catalog/tokenItems/tokenItem";
import { PendingExport } from "./useWorker";

const THREE_MF_MIME_TYPE = "model/3mf";

export const useExport = (
  workerRef: { current: Worker | undefined },
  requestIdRef: { current: number },
  pendingExportRef: { current: PendingExport | undefined },
  tokenItems: TokenItem[],
  guildName: string | undefined,
  sharedConfig: SharedConfig,
) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const [exportFailures, setExportFailures] = useState<ExportFailureItem[]>([]);

  const exportThreeMf = useCallback(async () => {
    if (!workerRef.current || tokenItems.length === 0) {
      return;
    }

    setExportError(undefined);
    setExportFailures([]);
    setIsExporting(true);

    const requestId = ++requestIdRef.current;

    try {
      const response = await new Promise<ExportResponse>((resolve, reject) => {
        pendingExportRef.current = { requestId, resolve, reject };

        const request: WorkerRequest = {
          kind: "export",
          requestId,
          items: tokenItems,
          colorGroups: sharedConfig.colorGroups,
        };

        workerRef.current?.postMessage(request);
      });

      if (response.status === "failed") {
        setExportFailures(response.failures);
        return;
      }

      downloadBlob(response.archive, `${guildName ?? "tokens"}.3mf`, THREE_MF_MIME_TYPE);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExporting(false);
    }
  }, [tokenItems, guildName, sharedConfig]);

  return { isExporting, exportError, exportFailures, exportThreeMf };
};
