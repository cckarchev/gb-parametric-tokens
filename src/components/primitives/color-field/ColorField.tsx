import styles from "./ColorField.module.css";

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const ColorField = ({ label, value, onChange }: ColorFieldProps) => {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
};
