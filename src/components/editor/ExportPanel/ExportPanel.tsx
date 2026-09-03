import { ChangeEvent } from "react";

import { Button } from "../../primitives/Button/Button";
import styles from "./ExportPanel.module.css";

export type ExportPanelProps = {
  onExportThreeMf: () => void;
  exportError: string | undefined;
  onExportSpecJson: () => void;
  onImportSpecJson: (file: File) => void;
  importError: string | undefined;
};

export const ExportPanel = ({
  onExportThreeMf,
  exportError,
  onExportSpecJson,
  onImportSpecJson,
  importError,
}: ExportPanelProps) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onImportSpecJson(file);
    }

    event.target.value = "";
  };

  return (
    <section className={styles.panel}>
      <div className={styles.row}>
        <Button label="Download .3mf" variant="primary" onClick={onExportThreeMf} />
        {exportError && <p className={styles.error}>{exportError}</p>}
      </div>

      <div className={styles.row}>
        <Button label="Download spec (.json)" onClick={onExportSpecJson} />
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Load spec (.json)</span>
        <input type="file" accept="application/json" onChange={handleFileChange} />
      </label>
      {importError && <p className={styles.error}>{importError}</p>}
    </section>
  );
};
