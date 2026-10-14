import { PreviewItem } from "@/browser/tokenWorker";
import { groupAttentionItems } from "@/core/token/validation/groupAttentionItems";

import styles from "./ExportPanel.module.css";

// The slice of a failed PreviewItem this panel actually renders, derived from it rather than
// restated, so the two can't drift apart.
export type InvalidPreviewItem = Pick<PreviewItem, "id" | "group" | "name" | "reason">;

type AttentionListProps = {
  statusText: string;
  invalidItems: InvalidPreviewItem[];
};

export const AttentionList = ({ statusText, invalidItems }: AttentionListProps) => {
  return (
    <details className={styles.attentionBox}>
      <summary className={`${styles.status} ${styles.statusAttention} ${styles.attentionSummary}`}>
        <span className={styles.statusIcon} aria-hidden="true">
          ✗
        </span>
        <span className={styles.attentionSummaryText}>{statusText}</span>
        <span className={styles.attentionChevron} aria-hidden="true" />
      </summary>
      <ul className={styles.attentionList} aria-label="Tokens needing attention">
        {groupAttentionItems(invalidItems).map((group) => (
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
  );
};
