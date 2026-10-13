import { ReactNode } from "react";

import { SharedConfig } from "../../../../../../core/token/catalog/tokenItems/tokenItem";
import { Button } from "../../../../../primitives/Button/Button";
import { Panel } from "../../../../../primitives/Panel/Panel";
import styles from "./SectionPanel.module.css";

// What every section receives: the whole config in, the whole config back out, so each section
// can touch exactly the fields it owns.
export type SectionProps = {
  sharedConfig: SharedConfig;
  onChange: (sharedConfig: SharedConfig) => void;
};

type SectionPanelProps = {
  title: string;
  onReset: () => void;
  // One muted line under the fields, for a setting this section depends on but doesn't own.
  note?: string;
  children: ReactNode;
};

// One collapsible section of the advanced settings, with a reset that restores only its own
// fields (each section decides which fields those are).
export const SectionPanel = ({ title, onReset, note, children }: SectionPanelProps) => {
  return (
    <Panel title={title}>
      {children}

      {note && <p className={styles.note}>{note}</p>}

      <div className={styles.resetRow}>
        <Button label={`Reset ${title} to defaults`} onClick={onReset} />
      </div>
    </Panel>
  );
};
