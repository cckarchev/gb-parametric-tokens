import { useCallback, useState } from "react";

import { downloadBlob } from "@/browser/downloadBlob";
import type { ExportFailureItem, ExportResponse, WorkerRequest } from "@/browser/tokenWorker";
import { describeError } from "@/core/describeError";
import { SharedConfig, TokenItem } from "@/core/token/catalog/tokenItems/tokenItem";

import { PendingExport } from "./useWorker";

const THREE_MF_MIME_TYPE = "model/3mf";
// The archive's name while no guild is loaded, which the UI never lets an export reach.
const FALLBACK_ARCHIVE_NAME = "tokens";

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

      downloadBlob(
        response.archive,
        `${guildName ?? FALLBACK_ARCHIVE_NAME}.3mf`,
        THREE_MF_MIME_TYPE,
      );
    } catch (error) {
      setExportError(describeError(error));
    } finally {
      setIsExporting(false);
    }
  }, [tokenItems, guildName, sharedConfig]);

  return { isExporting, exportError, exportFailures, exportThreeMf };
};
