import { ExportFailureItem } from "../../../browser/tokenWorker";
import { Button } from "../../primitives/Button/Button";
import { AttentionList, InvalidPreviewItem } from "./AttentionList";
import styles from "./ExportPanel.module.css";

type ExportPanelProps = {
  isExporting: boolean;
  exportError: string | undefined;
  exportFailures: ExportFailureItem[];
  onExport: () => void;
  isPreviewing: boolean;
  validCount: number;
  invalidCount: number;
  invalidItems: InvalidPreviewItem[];
};

type StatusTone = "neutral" | "ready" | "attention";

const STATUS_CLASS_BY_TONE: Record<StatusTone, string> = {
  neutral: styles.statusNeutral,
  ready: styles.statusReady,
  attention: styles.statusAttention,
};

const describeStatus = (
  isPreviewing: boolean,
  validCount: number,
  invalidCount: number,
): { tone: StatusTone; text: string } => {
  if (isPreviewing) {
    return { tone: "neutral", text: "Checking tokens..." };
  }

  const totalCount = validCount + invalidCount;

  if (totalCount === 0) {
    return { tone: "neutral", text: "No tokens selected." };
  }

  if (invalidCount > 0) {
    return { tone: "attention", text: `${invalidCount} of ${totalCount} tokens need attention.` };
  }

  const tokenWord = validCount === 1 ? "token" : "tokens";

  return { tone: "ready", text: `${validCount} ${tokenWord} ready to print.` };
};

export const ExportPanel = ({
  isExporting,
  exportError,
  exportFailures,
  onExport,
  isPreviewing,
  validCount,
  invalidCount,
  invalidItems,
}: ExportPanelProps) => {
  const status = describeStatus(isPreviewing, validCount, invalidCount);

  return (
    <div className={styles.panel}>
      {invalidItems.length > 0 ? (
        <AttentionList statusText={status.text} invalidItems={invalidItems} />
      ) : (
        <p className={`${styles.status} ${STATUS_CLASS_BY_TONE[status.tone]}`}>
          {status.tone !== "neutral" && (
            <span className={styles.statusIcon} aria-hidden="true">
              {status.tone === "ready" ? "✓" : "✗"}
            </span>
          )}
          {status.text}
        </p>
      )}

      <Button
        label={isExporting ? "Exporting..." : "Download tokens (.3mf)"}
        variant="primary"
        onClick={onExport}
        disabled={isExporting}
      />

      {exportError && (
        <p className={styles.alert} role="alert">
          {exportError}
        </p>
      )}

      {exportFailures.length > 0 && (
        <div className={styles.alert} role="alert">
          <p>Export failed. These tokens failed:</p>
          <ul>
            {exportFailures.map((failure) => (
              <li key={failure.id}>
                {failure.label}: {failure.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
