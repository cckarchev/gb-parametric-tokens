import { Fragment } from "react";

import { resolveAoeTemplate } from "../../../core/token/catalog/aoeTemplates";
import { CatalogCharacter, GuildCatalog } from "../../../core/token/catalog/catalogTypes";
import { characterSelectableIds } from "../../../core/token/catalog/characterSelectableIds";
import { buildEffectLabels } from "../../../core/token/catalog/effectLabels";
import { resolveEffect } from "../../../core/token/catalog/effects";
import {
  characterAoeTemplateId,
  characterTokenId,
  MIN_COPIES,
} from "../../../core/token/catalog/tokenItems/tokenItem";
import { CheckboxField } from "../../primitives/CheckboxField/CheckboxField";
import { Panel } from "../../primitives/Panel/Panel";
import { SelectAllCheckbox } from "../../primitives/SelectAllCheckbox/SelectAllCheckbox";
import styles from "./CharacterTokenList.module.css";
import { TokenRow } from "./TokenRow";

type CharacterTokenListProps = {
  catalog: GuildCatalog;
  selectedTokenIds: string[];
  onSelectedTokenIdsChange: (selectedTokenIds: string[]) => void;
  tokenCopies: Record<string, number>;
  onTokenCopiesChange: (tokenCopies: Record<string, number>) => void;
};

export const CharacterTokenList = ({
  catalog,
  selectedTokenIds,
  onSelectedTokenIdsChange,
  tokenCopies,
  onTokenCopiesChange,
}: CharacterTokenListProps) => {
  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onSelectedTokenIdsChange([...selectedTokenIds, id]);
      return;
    }

    onSelectedTokenIdsChange(selectedTokenIds.filter((selectedId) => selectedId !== id));
  };

  const toggleCharacter = (character: CatalogCharacter, checked: boolean) => {
    const ids = characterSelectableIds(character);

    if (checked) {
      const withoutCharacter = selectedTokenIds.filter((id) => !ids.includes(id));

      onSelectedTokenIdsChange([...withoutCharacter, ...ids]);
      return;
    }

    onSelectedTokenIdsChange(selectedTokenIds.filter((id) => !ids.includes(id)));
  };

  const allTokenIds = catalog.characters.flatMap(characterSelectableIds);
  const everyTokenSelected = allTokenIds.every((id) => selectedTokenIds.includes(id));
  const allSelected = allTokenIds.length > 0 && everyTokenSelected;

  const toggleAll = (checked: boolean) => {
    onSelectedTokenIdsChange(checked ? allTokenIds : []);
  };

  const setCopies = (id: string, copies: number) => {
    onTokenCopiesChange({ ...tokenCopies, [id]: copies });
  };

  const renderRow = (id: string, label: string, maxCopies: number | undefined) => {
    return (
      <TokenRow
        key={id}
        label={label}
        maxCopies={maxCopies}
        selected={selectedTokenIds.includes(id)}
        copies={tokenCopies[id] ?? MIN_COPIES}
        onToggle={(checked) => toggle(id, checked)}
        onCopiesChange={(copies) => setCopies(id, copies)}
      />
    );
  };

  return (
    <Panel
      title="Character tokens"
      headerAccessory={
        <SelectAllCheckbox
          checked={allSelected}
          onChange={toggleAll}
          disabled={allTokenIds.length === 0}
        />
      }>
      {/* One flat list of rows (character headers and their tokens as direct siblings, not
          nested per character) so the zebra striping below alternates continuously across the
          whole table instead of resetting inside each character's own token group. */}
      <div className={styles.rows}>
        {catalog.characters.map((character) => {
          const ids = characterSelectableIds(character);
          const hasTokens = ids.length > 0;
          const selectedCount = ids.filter((id) => selectedTokenIds.includes(id)).length;
          const characterAllSelected = hasTokens && selectedCount === ids.length;
          const effects = character.effects.map(resolveEffect);
          const effectLabels = buildEffectLabels(effects);
          const templates = (character.aoeTemplates ?? []).map(resolveAoeTemplate);

          return (
            <Fragment key={character.name}>
              <div className={styles.row}>
                <CheckboxField
                  label={character.name}
                  checked={characterAllSelected}
                  onChange={(checked) => toggleCharacter(character, checked)}
                  disabled={!hasTokens}
                />

                {hasTokens && (
                  <span className={styles.count}>
                    {selectedCount}/{ids.length}
                  </span>
                )}
              </div>

              {effects.map((effect, tokenIndex) =>
                renderRow(
                  characterTokenId(character.name, tokenIndex),
                  effectLabels[tokenIndex],
                  effect.maxCopies,
                ),
              )}

              {templates.length > 0 && (
                <div className={`${styles.row} ${styles.rowToken} ${styles.subheading}`}>
                  AOE templates
                </div>
              )}

              {templates.map((template, templateIndex) =>
                renderRow(
                  characterAoeTemplateId(character.name, templateIndex),
                  template.name,
                  template.maxCopies,
                ),
              )}

              {!hasTokens && (
                <div className={`${styles.row} ${styles.rowToken}`}>
                  <span className={styles.characterNameDisabled}>No tokens</span>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </Panel>
  );
};
