import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";
import { NumberField } from "@/components/primitives/number-field/NumberField";
import styles from "@/styles/listRow.module.css";

type CountFieldProps = {
  label: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  copies: number;
  onCopiesChange: (copies: number) => void;
  min: number;
  max: number;
};

// A checkbox to include the counter and a stepper for its copies. Unchecked, the stepper is
// disabled but keeps its value.
export const CountField = ({
  label,
  enabled,
  onEnabledChange,
  copies,
  onCopiesChange,
  min,
  max,
}: CountFieldProps) => {
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
