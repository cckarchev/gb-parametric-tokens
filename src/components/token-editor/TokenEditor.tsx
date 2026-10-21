import { useTokenGenerator } from "@/hooks/useTokenGenerator";

import { ExportPanel } from "./export-panel/ExportPanel";
import { GuildSelector } from "./guild-selector/GuildSelector";
import { SelectionLists } from "./SelectionLists";
import styles from "./TokenEditor.module.css";
import { TokenConfigEditor } from "./token-config-editor/TokenConfigEditor";
import { TokenPreview } from "./token-preview/TokenPreview";

export const TokenEditor = () => {
  const generator = useTokenGenerator();

  // The guild picker is the home screen: it shows only while no guild is open, and the header's
  // logo brings it back.
  if (generator.selectedGuildId === undefined) {
    return (
      <div className={styles.page}>
        <GuildSelector
          guilds={generator.guilds}
          onSelect={generator.selectGuild}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.previewColumn}>
          {generator.catalog && (
            <TokenPreview
              items={generator.previewItems}
              isPreviewing={generator.isPreviewing}
              colorGroups={generator.sharedConfig.colorGroups}
            />
          )}
        </div>

        <div className={styles.formColumn}>
          {generator.catalogStatus === "error" && (
            <p>Failed to load catalog: {generator.catalogError}</p>
          )}

          {generator.catalog && (
            <>
              <SelectionLists
                catalog={generator.catalog}
                selection={generator.selection}
                setSelection={generator.setSelection}
              />

              <TokenConfigEditor
                sharedConfig={generator.sharedConfig}
                onChange={generator.setSharedConfig}
                onExportSettings={generator.exportSettingsJson}
                onImportSettings={generator.importSettingsJson}
                importSettingsError={generator.importSettingsError}
              />

              <ExportPanel
                isExporting={generator.isExporting}
                exportError={generator.exportError}
                exportFailures={generator.exportFailures}
                onExport={generator.exportThreeMf}
                isPreviewing={generator.isPreviewing}
                validCount={generator.validCount}
                invalidCount={generator.invalidCount}
                invalidItems={generator.invalidPreviewItems}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
