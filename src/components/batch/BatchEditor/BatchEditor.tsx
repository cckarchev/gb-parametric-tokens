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
        <GuildSelector
          guilds={batch.guilds}
          selectedGuildId={batch.selectedGuildId}
          onSelect={batch.selectGuild}
        />

        {batch.catalogStatus === "loading" && <p>Loading catalog...</p>}
        {batch.catalogStatus === "error" && <p>Failed to load catalog: {batch.catalogError}</p>}

        {batch.catalog && (
          <>
            <CharacterTokenList
              catalog={batch.catalog}
              selectedTokenIds={batch.selection.characterTokenIds}
              onChange={(characterTokenIds) =>
                batch.setSelection({ ...batch.selection, characterTokenIds })
              }
            />

            <GuildTokenList
              catalog={batch.catalog}
              genericCopies={batch.selection.genericCopies}
              onGenericCopiesChange={(genericCopies) =>
                batch.setSelection({ ...batch.selection, genericCopies })
              }
              influenceCopies={batch.selection.influenceCopies}
              onInfluenceCopiesChange={(influenceCopies) =>
                batch.setSelection({ ...batch.selection, influenceCopies })
              }
              momentumCopies={batch.selection.momentumCopies}
              onMomentumCopiesChange={(momentumCopies) =>
                batch.setSelection({ ...batch.selection, momentumCopies })
              }
              goalInfluenceCopies={batch.selection.goalInfluenceCopies}
              onGoalInfluenceCopiesChange={(goalInfluenceCopies) =>
                batch.setSelection({ ...batch.selection, goalInfluenceCopies })
              }
            />

            <BatchConfigEditor sharedConfig={batch.sharedConfig} onChange={batch.setSharedConfig} />

            <BatchExportPanel
              isExporting={batch.isExporting}
              exportError={batch.exportError}
              exportFailures={batch.exportFailures}
              onExport={batch.exportZip}
            />
          </>
        )}
      </div>
    </div>
  );
};
