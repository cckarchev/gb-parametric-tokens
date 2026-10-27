import type { SharedConfig } from "@/core/token/catalog/token-items/tokenItem";

import { AdvancedSettingsPanel } from "./advanced-settings-panel/AdvancedSettingsPanel";
import { PrintOptionsPanel } from "./print-options-panel/PrintOptionsPanel";
import styles from "./TokenConfigEditor.module.css";

type TokenConfigEditorProps = {
  sharedConfig: SharedConfig;
  onChange: (sharedConfig: SharedConfig) => void;
  onExportSettings: () => void;
  onImportSettings: (file: File) => void;
  importSettingsError: string | undefined;
};

export const TokenConfigEditor = ({
  sharedConfig,
  onChange,
  onExportSettings,
  onImportSettings,
  importSettingsError,
}: TokenConfigEditorProps) => (
  <div className={styles.wrapper}>
    <PrintOptionsPanel sharedConfig={sharedConfig} onChange={onChange} />

    <AdvancedSettingsPanel
      sharedConfig={sharedConfig}
      onChange={onChange}
      onExportSettings={onExportSettings}
      onImportSettings={onImportSettings}
      importSettingsError={importSettingsError}
    />
  </div>
);
