import { TokenSelection } from "../../../core/token/catalog/tokenItems/tokenItem";
import { useTokenGenerator } from "../../../hooks/useTokenGenerator";
import { CharacterTokenList } from "../CharacterTokenList/CharacterTokenList";
import { ConditionList } from "../ConditionList/ConditionList";
import { ExportPanel } from "../ExportPanel/ExportPanel";
import { GuildSelector } from "../GuildSelector/GuildSelector";
import { GuildTokenList } from "../GuildTokenList/GuildTokenList";
import { TokenConfigEditor } from "../TokenConfigEditor/TokenConfigEditor";
import { TokenPreview } from "../TokenPreview/TokenPreview";
import styles from "./TokenEditor.module.css";

export const TokenEditor = () => {
  const generator = useTokenGenerator();

  // Every list below owns exactly one field of the selection. Functional updates (not
  // `{ ...generator.selection, [field]: value }`): GuildTokenList's own "Select all" fires
  // several of these setters synchronously in one click handler, and each one needs to build on
  // the previous call's result, not on the single `generator.selection` snapshot this render
  // closed over -- otherwise only the last call would actually stick (a real, user-caught bug:
  // the checkbox looked like it did nothing).
  const updateSelectionField =
    <Field extends keyof TokenSelection>(field: Field) =>
    (value: TokenSelection[Field]) => {
      generator.setSelection((selection) => ({ ...selection, [field]: value }));
    };

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
              <CharacterTokenList
                catalog={generator.catalog}
                selectedTokenIds={generator.selection.characterTokenIds}
                onSelectedTokenIdsChange={updateSelectionField("characterTokenIds")}
                tokenCopies={generator.selection.characterTokenCopies}
                onTokenCopiesChange={updateSelectionField("characterTokenCopies")}
              />

              <GuildTokenList
                catalog={generator.catalog}
                genericTokens={generator.selection.genericTokens}
                onGenericTokensChange={updateSelectionField("genericTokens")}
                influence={generator.selection.influence}
                onInfluenceChange={updateSelectionField("influence")}
                momentum={generator.selection.momentum}
                onMomentumChange={updateSelectionField("momentum")}
                goalInfluence={generator.selection.goalInfluence}
                onGoalInfluenceChange={updateSelectionField("goalInfluence")}
              />

              <ConditionList
                conditions={generator.catalog.conditions}
                selection={generator.selection.conditions}
                onSelectionChange={updateSelectionField("conditions")}
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
