import { BatchExportFailureItem } from "../../../browser/batchWorker";
import { Button } from "../../primitives/Button/Button";
import styles from "./BatchExportPanel.module.css";

export type BatchExportPanelProps = {
  isExporting: boolean;
  exportError: string | undefined;
  exportFailures: BatchExportFailureItem[];
  onExport: () => void;
};

export const BatchExportPanel = ({
  isExporting,
  exportError,
  exportFailures,
  onExport,
}: BatchExportPanelProps) => {
  return (
    <div className={styles.panel}>
      <Button
        label={isExporting ? "Exporting..." : "Download batch (.3mf)"}
        variant="primary"
        onClick={onExport}
        disabled={isExporting}
      />

      {exportError && (
        <p className={styles.alert} role="alert">
          {exportError}
        </p>
      )}

      {exportFailures.length > 0 && (
        <div className={styles.alert} role="alert">
          <p>The batch was not exported. These tokens failed:</p>
          <ul>
            {exportFailures.map((failure) => (
              <li key={failure.id}>
                {failure.label}: {failure.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
