import styles from "./CheckboxField.module.css";

export type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const CheckboxField = ({ label, checked, onChange }: CheckboxFieldProps) => {
  return (
    <label className={styles.row}>
      <input
        className={styles.checkbox}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
};
