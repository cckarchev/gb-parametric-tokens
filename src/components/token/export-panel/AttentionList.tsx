import { PreviewItem } from "@/browser/tokenWorker";

import styles from "./ExportPanel.module.css";

// The slice of a failed PreviewItem this panel actually renders, derived from it rather than
// restated, so the two can't drift apart.
export type InvalidPreviewItem = Pick<PreviewItem, "id" | "group" | "name" | "reason">;

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
  );
};
