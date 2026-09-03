import { ReactNode, useState } from "react";

import styles from "./Panel.module.css";

export type PanelProps = {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
};

export const Panel = ({ title, defaultExpanded = true, children }: PanelProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <fieldset className={styles.panel}>
      <legend className={styles.legend}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}>
          <span>{title}</span>
          <span className={styles.chevron} aria-hidden="true" />
        </button>
      </legend>

      <div className={styles.body} hidden={!expanded}>
        {children}
      </div>
    </fieldset>
  );
};
