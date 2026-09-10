import { SharedConfig } from "../../../core/token/catalog/tokenItems/tokenItem";
import { AdvancedSettingsPanel } from "./AdvancedSettingsPanel/AdvancedSettingsPanel";
import { PrintOptionsPanel } from "./PrintOptionsPanel/PrintOptionsPanel";
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
}: TokenConfigEditorProps) => {
  return (
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
};
