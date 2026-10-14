import { TokenSelection } from "@/core/token/catalog/tokenItems/tokenItem";
import { useTokenGenerator } from "@/hooks/useTokenGenerator";

import { CounterRecordList } from "../CounterRecordList";
import { CharacterTokenList } from "../character-token-list/CharacterTokenList";
import { ExportPanel } from "../export-panel/ExportPanel";
import { GuildTokenList } from "../GuildTokenList";
import { GuildSelector } from "../guild-selector/GuildSelector";
import { TokenConfigEditor } from "../token-config-editor/TokenConfigEditor";
import { TokenPreview } from "../token-preview/TokenPreview";
import styles from "./TokenEditor.module.css";

const MAX_CONDITION_COPIES = 12;
const MAX_GAME_PLAN_COPIES = 1;

export const TokenEditor = () => {
  const generator = useTokenGenerator();

  // Every list below owns exactly one field of the selection. Functional updates (not
  // `{ ...generator.selection, [field]: value }`): GuildTokenList's own "Select all" fires
  // several of these setters synchronously in one click handler, and each one needs to build on
  // the previous call's result, not on the single `generator.selection` snapshot this render
  // closed over: otherwise only the last call would actually stick (a real, user-caught bug:
  // the checkbox looked like it did nothing).
  const updateSelectionField =
    <Field extends keyof TokenSelection>(field: Field) =>
    (value: TokenSelection[Field]) => {
      generator.setSelection((selection) => ({ ...selection, [field]: value }));
    };

  // The generic catalog has no roster, and only it carries the Game Plan deck.
  const hasCharacters = (generator.catalog?.characters.length ?? 0) > 0;
  const hasGamePlans = (generator.catalog?.gamePlans.length ?? 0) > 0;

  // The guild picker is the home screen: it shows only while no guild is open, and the header's
  // logo brings it back.
  if (generator.selectedGuildId === undefined) {
    return (
      <div className={styles.page}>
        <GuildSelector guilds={generator.guilds} onSelect={generator.selectGuild} />
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
              {hasCharacters && (
                <CharacterTokenList
                  catalog={generator.catalog}
                  selectedTokenIds={generator.selection.characterTokenIds}
                  onSelectedTokenIdsChange={updateSelectionField("characterTokenIds")}
                  tokenCopies={generator.selection.characterTokenCopies}
                  onTokenCopiesChange={updateSelectionField("characterTokenCopies")}
                />
              )}

              {/* In the roster's spot: for the generic catalog, the game plans are its "models". */}
              {hasGamePlans && (
                <CounterRecordList
                  title="Game Plans"
                  entries={generator.catalog.gamePlans}
                  maxCopies={MAX_GAME_PLAN_COPIES}
                  selection={generator.selection.gamePlans}
                  onSelectionChange={updateSelectionField("gamePlans")}
                />
              )}

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

              <CounterRecordList
                title="Conditions"
                entries={generator.catalog.conditions}
                maxCopies={MAX_CONDITION_COPIES}
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
