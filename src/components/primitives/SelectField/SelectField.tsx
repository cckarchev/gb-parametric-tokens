import styles from "./SelectField.module.css";

export type SelectFieldOption<T extends string> = { value: T; label: string };

export type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: SelectFieldOption<T>[];
  onChange: (value: T) => void;
};

export const SelectField = <T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) => {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.row}>
        <select
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
};
