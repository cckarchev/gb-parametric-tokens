import { useBatch } from "../../../hooks/useBatch";
import { BatchConfigEditor } from "../BatchConfigEditor/BatchConfigEditor";
import { BatchExportPanel } from "../BatchExportPanel/BatchExportPanel";
import { BatchPreview } from "../BatchPreview/BatchPreview";
import { CharacterTokenList } from "../CharacterTokenList/CharacterTokenList";
import { GuildSelector } from "../GuildSelector/GuildSelector";
import { GuildTokenList } from "../GuildTokenList/GuildTokenList";
import styles from "./BatchEditor.module.css";

export const BatchEditor = () => {
  const batch = useBatch();

  return (
    <div className={styles.page}>
      <GuildSelector
        guilds={batch.guilds}
        selectedGuildId={batch.selectedGuildId}
        onSelect={batch.selectGuild}
      />

      <div className={styles.layout}>
        <div className={styles.previewColumn}>
          {batch.catalog && (
            <BatchPreview
              items={batch.previewItems}
              isPreviewing={batch.isPreviewing}
              validCount={batch.validCount}
              invalidCount={batch.invalidCount}
              colorGroups={batch.sharedConfig.colorGroups}
            />
          )}
        </div>

        <div className={styles.formColumn}>
          {batch.catalogStatus === "loading" && <p>Loading catalog...</p>}
          {batch.catalogStatus === "error" && <p>Failed to load catalog: {batch.catalogError}</p>}

          {batch.catalog && (
            <>
              <CharacterTokenList
                catalog={batch.catalog}
                selectedTokenIds={batch.selection.characterTokenIds}
                onSelectedTokenIdsChange={(characterTokenIds) =>
                  batch.setSelection((selection) => ({ ...selection, characterTokenIds }))
                }
                tokenCopies={batch.selection.characterTokenCopies}
                onTokenCopiesChange={(characterTokenCopies) =>
                  batch.setSelection((selection) => ({ ...selection, characterTokenCopies }))
                }
              />

              {/* Functional updates (not `{ ...batch.selection, field }`) below: GuildTokenList's
                  own "Select all" fires all four of these onChange callbacks synchronously in one
                  click handler, and each one needs to build on the previous call's result, not on
                  the single `batch.selection` snapshot this render closed over -- otherwise only
                  the last of the four calls would actually stick (a real, user-caught bug: the
                  checkbox looked like it did nothing). */}
              <GuildTokenList
                catalog={batch.catalog}
                genericTokens={batch.selection.genericTokens}
                onGenericTokensChange={(genericTokens) =>
                  batch.setSelection((selection) => ({ ...selection, genericTokens }))
                }
                influence={batch.selection.influence}
                onInfluenceChange={(influence) =>
                  batch.setSelection((selection) => ({ ...selection, influence }))
                }
                momentum={batch.selection.momentum}
                onMomentumChange={(momentum) =>
                  batch.setSelection((selection) => ({ ...selection, momentum }))
                }
                goalInfluence={batch.selection.goalInfluence}
                onGoalInfluenceChange={(goalInfluence) =>
                  batch.setSelection((selection) => ({ ...selection, goalInfluence }))
                }
              />

              <BatchConfigEditor
                sharedConfig={batch.sharedConfig}
                onChange={batch.setSharedConfig}
                onExportSettings={batch.exportSettingsJson}
                onImportSettings={batch.importSettingsJson}
                importSettingsError={batch.importSettingsError}
              />

              <BatchExportPanel
                isExporting={batch.isExporting}
                exportError={batch.exportError}
                exportFailures={batch.exportFailures}
                onExport={batch.exportThreeMf}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
