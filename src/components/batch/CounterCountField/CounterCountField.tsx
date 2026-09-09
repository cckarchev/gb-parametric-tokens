import { CheckboxField } from "../../primitives/CheckboxField/CheckboxField";
import { NumberField } from "../../primitives/NumberField/NumberField";
import styles from "./CounterCountField.module.css";

export type CounterCountFieldProps = {
  label: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  copies: number;
  onCopiesChange: (copies: number) => void;
  min: number;
  max: number;
};

// A checkbox (is this counter included in the batch at all) plus a -/+ stepper for how many
// copies, the same pattern CharacterTokenList uses for a per-token copies count. The stepper
// stays disabled -- but keeps showing its last value -- while unchecked, so re-checking restores
// it instead of resetting to the field's minimum.
export const CounterCountField = ({
  label,
  enabled,
  onEnabledChange,
  copies,
  onCopiesChange,
  min,
  max,
}: CounterCountFieldProps) => {
  return (
    <div className={styles.row}>
      <CheckboxField label={label} checked={enabled} onChange={onEnabledChange} />

      <NumberField
        label={`${label} copies`}
        hideLabel
        stepper
        value={copies}
        min={min}
        max={max}
        disabled={!enabled}
        onChange={onCopiesChange}
      />
    </div>
  );
};
