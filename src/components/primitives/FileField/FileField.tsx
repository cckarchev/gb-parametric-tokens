import { ChangeEvent } from "react";

import styles from "../../../styles/field.module.css";

export type FileFieldProps = {
  label: string;
  accept: string;
  onSelect: (file: File) => void;
};

export const FileField = ({ label, accept, onSelect }: FileFieldProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onSelect(file);
    }

    // Clearing the selection lets the very same file be picked again straight away: the browser
    // fires no change event when the newly picked file matches the one already in the input.
    event.target.value = "";
  };

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input type="file" accept={accept} onChange={handleChange} />
    </label>
  );
};
