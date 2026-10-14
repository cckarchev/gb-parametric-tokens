import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";
import { NumberField } from "@/components/primitives/number-field/NumberField";
import { MIN_COPIES } from "@/core/token/catalog/token-items/tokenItem";

import styles from "./CharacterTokenList.module.css";

type TokenRowProps = {
  label: string;
  tag?: string;
  maxCopies: number;
  selected: boolean;
  copies: number;
  onToggle: (checked: boolean) => void;
  onCopiesChange: (copies: number) => void;
};

// One selectable line under a character, shared by its tokens and its AOE templates: a checkbox,
// an optional muted tag that tells the kinds apart, and a copies stepper only when the catalog entry
// allows more than one copy.
export const TokenRow = ({
  label,
  tag,
  maxCopies,
  selected,
  copies,
  onToggle,
  onCopiesChange,
}: TokenRowProps) => {
  const hasCopiesField = maxCopies > MIN_COPIES;

  return (
    <div className={`${styles.row} ${styles.rowToken}`}>
      <CheckboxField label={label} checked={selected} onChange={onToggle} />

      <div className={styles.rowAccessories}>
        {tag && <span className={styles.tag}>{tag}</span>}

        {hasCopiesField && (
          <NumberField
            label={`${label} copies`}
            hideLabel
            stepper
            value={copies}
            min={MIN_COPIES}
            max={maxCopies}
            disabled={!selected}
            onChange={onCopiesChange}
          />
        )}
      </div>
    </div>
  );
};
