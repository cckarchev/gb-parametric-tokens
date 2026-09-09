import { ExportFailureItem } from "../../../browser/tokenWorker";
import { Button } from "../../primitives/Button/Button";
import styles from "./ExportPanel.module.css";

export type ExportPanelProps = {
  isExporting: boolean;
  exportError: string | undefined;
  exportFailures: ExportFailureItem[];
  onExport: () => void;
};

export const ExportPanel = ({
  isExporting,
  exportError,
  exportFailures,
  onExport,
}: ExportPanelProps) => {
  return (
    <div className={styles.panel}>
      <Button
        label={isExporting ? "Exporting..." : "Download tokens (.3mf)"}
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
          <p>Export failed. These tokens failed:</p>
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
