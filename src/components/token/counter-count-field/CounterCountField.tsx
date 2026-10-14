import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";
import { NumberField } from "@/components/primitives/number-field/NumberField";
import styles from "@/styles/listRow.module.css";

type CounterCountFieldProps = {
  label: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  copies: number;
  onCopiesChange: (copies: number) => void;
  min: number;
  max: number;
};

// A checkbox (is this counter included in the run at all) plus a -/+ stepper for how many
// copies, the same pattern CharacterTokenList uses for a per-token copies count. The stepper
// stays disabled, but keeps showing its last value, while unchecked, so re-checking restores
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
    <div className={styles.listRow}>
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
