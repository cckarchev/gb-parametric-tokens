import type { ReactNode } from "react";

import styles from "./SelectField.module.css";

export type SelectFieldOption<T extends string> = { value: T; label: string };
export type SelectFieldGroup<T extends string> = {
  groupLabel: string;
  options: SelectFieldOption<T>[];
};
// A select's options can mix loose entries with grouped ones, same as native <option>/
// <optgroup> children can.
export type SelectFieldEntry<T extends string> = SelectFieldOption<T> | SelectFieldGroup<T>;

export type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: SelectFieldEntry<T>[];
  onChange: (value: T) => void;
  // An optional slot rendered after the select, e.g. a preview image for the selected value.
  trailing?: ReactNode;
};

const isGroup = <T extends string>(entry: SelectFieldEntry<T>): entry is SelectFieldGroup<T> => {
  return "groupLabel" in entry;
};

export const SelectField = <T extends string>({
  label,
  value,
  options,
  onChange,
  trailing,
}: SelectFieldProps<T>) => {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.row}>
        <select
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}>
          {options.map((entry) =>
            isGroup(entry) ? (
              <optgroup key={entry.groupLabel} label={entry.groupLabel}>
                {entry.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ),
          )}
        </select>
        {trailing}
      </span>
    </label>
  );
};
