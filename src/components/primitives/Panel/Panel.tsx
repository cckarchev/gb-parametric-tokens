import { ReactNode, useState } from "react";

import styles from "./Panel.module.css";

export type PanelProps = {
  title: string;
  defaultExpanded?: boolean;
  // Controlled expand/collapse: when both are given, the panel's own toggle button still works,
  // but the caller owns the state (e.g. to collapse the panel from outside in response to some
  // other action). Omit both to keep the panel uncontrolled (the default).
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  // Rendered next to the collapse toggle, inside the same header bar, as its own interactive
  // sibling -- the toggle is already a <button>, so this can't nest inside it.
  headerAccessory?: ReactNode;
  children: ReactNode;
};

export const Panel = ({
  title,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
  headerAccessory,
  children,
}: PanelProps) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  const toggle = () => {
    if (isControlled) {
      onExpandedChange?.(!expanded);
      return;
    }

    setInternalExpanded(!expanded);
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
