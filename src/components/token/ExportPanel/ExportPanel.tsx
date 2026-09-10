import { ExportFailureItem } from "../../../browser/tokenWorker";
import { Button } from "../../primitives/Button/Button";
import styles from "./ExportPanel.module.css";

export type InvalidPreviewItem = { id: string; group?: string; name: string; reason: string };

// A character's tokens share one heading instead of repeating the character's name on every
// line (see TokenItem's `group`); anything without a group (guild generics, Influence,
// Momentum, Goal Influence) is its own single-item group, headed by its own name.
type AttentionGroup = { key: string; heading: string; items: InvalidPreviewItem[] };

const groupInvalidItems = (items: InvalidPreviewItem[]): AttentionGroup[] => {
  const groupsByKey = new Map<string, AttentionGroup>();

  for (const item of items) {
    const key = item.group ?? item.id;
    const existingGroup = groupsByKey.get(key);

    if (existingGroup) {
      existingGroup.items.push(item);
      continue;
    }

    groupsByKey.set(key, { key, heading: item.group ?? item.name, items: [item] });
  }

  return [...groupsByKey.values()];
};

export type ExportPanelProps = {
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
        <details className={styles.attentionBox}>
          <summary
            className={`${styles.status} ${styles.statusAttention} ${styles.attentionSummary}`}>
            <span className={styles.statusIcon} aria-hidden="true">
              ✗
            </span>
            <span className={styles.attentionSummaryText}>{status.text}</span>
            <span className={styles.attentionChevron} aria-hidden="true" />
          </summary>
          <ul className={styles.attentionList} aria-label="Tokens needing attention">
            {groupInvalidItems(invalidItems).map((group) => (
              <li key={group.key} className={styles.attentionGroup}>
                <strong className={styles.attentionLabel}>{group.heading}</strong>
                <ul className={styles.attentionSubList}>
                  {group.items.map((item) => (
                    <li key={item.id} className={styles.attentionItem}>
                      {item.group && <span className={styles.attentionTitle}>{item.name}: </span>}
                      <span className={styles.attentionReason}>{item.reason}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </details>
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
