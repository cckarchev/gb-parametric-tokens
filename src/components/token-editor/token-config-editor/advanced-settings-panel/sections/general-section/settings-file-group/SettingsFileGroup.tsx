import { Button } from "@/components/primitives/button/Button";
import { FileField } from "@/components/primitives/FileField";
import { SettingsGroup } from "@/components/primitives/settings-group/SettingsGroup";

import styles from "./SettingsFileGroup.module.css";

type SettingsFileGroupProps = {
  onExportSettings: () => void;
  onImportSettings: (file: File) => void;
  importSettingsError: string | undefined;
};

export const SettingsFileGroup = ({
  onExportSettings,
  onImportSettings,
  importSettingsError,
}: SettingsFileGroupProps) => (
  <SettingsGroup title="Settings file">
    <div className={styles.row}>
      <Button label="Export settings (.json)" onClick={onExportSettings} />
    </div>

    <FileField
      label="Import settings (.json)"
      accept="application/json"
      onSelect={onImportSettings}
    />

    {importSettingsError && (
      <p className={styles.error}>{importSettingsError}</p>
    )}
  </SettingsGroup>
);
