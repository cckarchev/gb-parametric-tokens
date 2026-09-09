import styles from "./CheckboxField.module.css";

export type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  // Keeps the label as the checkbox's accessible name without showing it, for a bare checkbox
  // whose meaning is already clear from where it sits (e.g. a panel's own header).
  hideLabel?: boolean;
};

export const CheckboxField = ({
  label,
  checked,
  onChange,
  disabled,
  hideLabel,
}: CheckboxFieldProps) => {
  return (
    <label className={disabled ? styles.rowDisabled : styles.row}>
      <input
        className={styles.checkbox}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={hideLabel ? styles.labelHidden : undefined}>{label}</span>
    </label>
  );
};
