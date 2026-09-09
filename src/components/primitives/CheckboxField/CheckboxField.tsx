import styles from "./CheckboxField.module.css";

export type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export const CheckboxField = ({ label, checked, onChange, disabled }: CheckboxFieldProps) => {
  return (
    <label className={disabled ? styles.rowDisabled : styles.row}>
      <input
        className={styles.checkbox}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
};
