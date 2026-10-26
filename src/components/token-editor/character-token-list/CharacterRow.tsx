import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";

import styles from "./CharacterTokenList.module.css";

type CharacterRowProps = {
  name: string;
  selectedCount: number;
  tokenCount: number;
  onToggle: (checked: boolean) => void;
};

// The header line of one character: a checkbox that selects all of its tokens,
// and how many of them are selected. A character with no tokens shows a
// disabled checkbox and no count.
export const CharacterRow = ({
  name,
  selectedCount,
  tokenCount,
  onToggle,
}: CharacterRowProps) => {
  const hasTokens = tokenCount > 0;
  const allSelected = hasTokens && selectedCount === tokenCount;

  return (
    <div className={styles.row}>
      <CheckboxField
        label={name}
        checked={allSelected}
        onChange={onToggle}
        disabled={!hasTokens}
      />

      {hasTokens && (
        <span className={styles.count}>
          {selectedCount}/{tokenCount}
        </span>
      )}
    </div>
  );
};
