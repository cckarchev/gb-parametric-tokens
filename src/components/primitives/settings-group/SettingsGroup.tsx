import type { ReactNode } from "react";

import styles from "./SettingsGroup.module.css";

type SettingsGroupProps = {
  title: string;
  children: ReactNode;
};

export const SettingsGroup = ({ title, children }: SettingsGroupProps) => (
  <div className={styles.group}>
    <h2 className={styles.title}>{title}</h2>
    {children}
  </div>
);
