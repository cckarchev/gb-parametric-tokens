import type { ReactNode } from "react";

import styles from "./SettingsGroup.module.css";

export type SettingsGroupProps = {
  title: string;
  children: ReactNode;
};

export const SettingsGroup = ({ title, children }: SettingsGroupProps) => {
  return (
    <div className={styles.group}>
      <h3 className={styles.title}>{title}</h3>
      {children}
    </div>
  );
};
