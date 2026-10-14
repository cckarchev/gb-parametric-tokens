import { ReactNode, useState } from "react";

import styles from "./Panel.module.css";

type PanelProps = {
  title: string;
  defaultExpanded?: boolean;
  // Rendered next to the collapse toggle, inside the same header bar, as its own interactive
  // sibling: the toggle is already a <button>, so this can't nest inside it.
  headerAccessory?: ReactNode;
  children: ReactNode;
};

export const Panel = ({
  title,
  defaultExpanded = false,
  headerAccessory,
  children,
}: PanelProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    setExpanded(!expanded);
  };

  return (
    <fieldset className={styles.panel}>
      <legend className={styles.legend}>
        <div className={styles.legendRow}>
          {headerAccessory}

          <button type="button" className={styles.toggle} aria-expanded={expanded} onClick={toggle}>
            <span>{title}</span>
            <span className={styles.chevron} aria-hidden="true" />
          </button>
        </div>
      </legend>

      <div className={styles.body} hidden={!expanded}>
        {children}
      </div>
    </fieldset>
  );
};
