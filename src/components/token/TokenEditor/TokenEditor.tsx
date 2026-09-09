import { useTokenGenerator } from "../../../hooks/useTokenGenerator";
import { CharacterTokenList } from "../CharacterTokenList/CharacterTokenList";
import { ExportPanel } from "../ExportPanel/ExportPanel";
import { GuildSelector } from "../GuildSelector/GuildSelector";
import { GuildTokenList } from "../GuildTokenList/GuildTokenList";
import { TokenConfigEditor } from "../TokenConfigEditor/TokenConfigEditor";
import { TokenPreview } from "../TokenPreview/TokenPreview";
import styles from "./TokenEditor.module.css";

export const TokenEditor = () => {
  const generator = useTokenGenerator();

  return (
    <div className={styles.page}>
      <GuildSelector
        guilds={generator.guilds}
        selectedGuildId={generator.selectedGuildId}
        onSelect={generator.selectGuild}
      />

      <div className={styles.layout}>
        <div className={styles.previewColumn}>
          {generator.catalog && (
            <TokenPreview
              items={generator.previewItems}
              isPreviewing={generator.isPreviewing}
              validCount={generator.validCount}
              invalidCount={generator.invalidCount}
              colorGroups={generator.sharedConfig.colorGroups}
            />
          )}
        </div>

        <div className={styles.formColumn}>
          {generator.catalogStatus === "loading" && <p>Loading catalog...</p>}
          {generator.catalogStatus === "error" && (
            <p>Failed to load catalog: {generator.catalogError}</p>
          )}

          {generator.catalog && (
            <>
              <CharacterTokenList
                catalog={generator.catalog}
                selectedTokenIds={generator.selection.characterTokenIds}
                onSelectedTokenIdsChange={(characterTokenIds) =>
                  generator.setSelection((selection) => ({ ...selection, characterTokenIds }))
                }
                tokenCopies={generator.selection.characterTokenCopies}
                onTokenCopiesChange={(characterTokenCopies) =>
                  generator.setSelection((selection) => ({ ...selection, characterTokenCopies }))
                }
              />

              {/* Functional updates (not `{ ...generator.selection, field }`) below: GuildTokenList's
                  own "Select all" fires all four of these onChange callbacks synchronously in one
                  click handler, and each one needs to build on the previous call's result, not on
                  the single `generator.selection` snapshot this render closed over -- otherwise only
                  the last of the four calls would actually stick (a real, user-caught bug: the
                  checkbox looked like it did nothing). */}
              <GuildTokenList
                catalog={generator.catalog}
                genericTokens={generator.selection.genericTokens}
                onGenericTokensChange={(genericTokens) =>
                  generator.setSelection((selection) => ({ ...selection, genericTokens }))
                }
                influence={generator.selection.influence}
                onInfluenceChange={(influence) =>
                  generator.setSelection((selection) => ({ ...selection, influence }))
                }
                momentum={generator.selection.momentum}
                onMomentumChange={(momentum) =>
                  generator.setSelection((selection) => ({ ...selection, momentum }))
                }
                goalInfluence={generator.selection.goalInfluence}
                onGoalInfluenceChange={(goalInfluence) =>
                  generator.setSelection((selection) => ({ ...selection, goalInfluence }))
                }
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
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
