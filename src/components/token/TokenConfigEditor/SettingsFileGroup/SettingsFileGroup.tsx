import { Button } from "../../../primitives/Button/Button";
import { FileField } from "../../../primitives/FileField/FileField";
import { SettingsGroup } from "../../../primitives/SettingsGroup/SettingsGroup";
import styles from "./SettingsFileGroup.module.css";

export type SettingsFileGroupProps = {
  onExportSettings: () => void;
  onImportSettings: (file: File) => void;
  importSettingsError: string | undefined;
};

export const SettingsFileGroup = ({
  onExportSettings,
  onImportSettings,
  importSettingsError,
}: SettingsFileGroupProps) => {
  return (
    <SettingsGroup title="Settings file">
      <div className={styles.row}>
        <Button label="Export settings (.json)" onClick={onExportSettings} />
      </div>

      <FileField
        label="Import settings (.json)"
        accept="application/json"
        onSelect={onImportSettings}
      />

      {importSettingsError && <p className={styles.error}>{importSettingsError}</p>}
    </SettingsGroup>
  );
};
