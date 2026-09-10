import { Fragment } from "react";

import { CatalogCharacter, GuildCatalog } from "../../../core/token/catalog/catalogTypes";
import { resolveEffect } from "../../../core/token/catalog/effects";
import { characterTokenId, MIN_COPIES } from "../../../core/token/catalog/tokenItems/tokenItem";
import { CheckboxField } from "../../primitives/CheckboxField/CheckboxField";
import { NumberField } from "../../primitives/NumberField/NumberField";
import { Panel } from "../../primitives/Panel/Panel";
import { SelectAllCheckbox } from "../../primitives/SelectAllCheckbox/SelectAllCheckbox";
import styles from "./CharacterTokenList.module.css";

export type CharacterTokenListProps = {
  catalog: GuildCatalog;
  selectedTokenIds: string[];
  onSelectedTokenIdsChange: (selectedTokenIds: string[]) => void;
  tokenCopies: Record<string, number>;
  onTokenCopiesChange: (tokenCopies: Record<string, number>) => void;
};

const tokenIdsForCharacter = (character: CatalogCharacter): string[] => {
  return character.effects.map((_, tokenIndex) => characterTokenId(character.name, tokenIndex));
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
    const ids = tokenIdsForCharacter(character);

    if (checked) {
      const withoutCharacter = selectedTokenIds.filter((id) => !ids.includes(id));

      onSelectedTokenIdsChange([...withoutCharacter, ...ids]);
      return;
    }

    onSelectedTokenIdsChange(selectedTokenIds.filter((id) => !ids.includes(id)));
  };

  const allTokenIds = catalog.characters.flatMap(tokenIdsForCharacter);
  const everyTokenSelected = allTokenIds.every((id) => selectedTokenIds.includes(id));
  const allSelected = allTokenIds.length > 0 && everyTokenSelected;

  const toggleAll = (checked: boolean) => {
    onSelectedTokenIdsChange(checked ? allTokenIds : []);
  };

  const setCopies = (id: string, copies: number) => {
    onTokenCopiesChange({ ...tokenCopies, [id]: copies });
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
          const ids = tokenIdsForCharacter(character);
          const hasTokens = ids.length > 0;
          const selectedCount = ids.filter((id) => selectedTokenIds.includes(id)).length;
          const characterAllSelected = hasTokens && selectedCount === ids.length;

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

              {hasTokens ? (
                character.effects.map((effectName, tokenIndex) => {
                  const effect = resolveEffect(effectName);
                  const id = characterTokenId(character.name, tokenIndex);
                  const selected = selectedTokenIds.includes(id);
                  const hasCopiesField = (effect.maxCopies ?? 1) > 1;

                  return (
                    <div className={`${styles.row} ${styles.rowToken}`} key={id}>
                      <CheckboxField
                        label={effect.name}
                        checked={selected}
                        onChange={(checked) => toggle(id, checked)}
                      />

                      {hasCopiesField && (
                        <NumberField
                          label={`${effect.name} copies`}
                          hideLabel
                          stepper
                          value={tokenCopies[id] ?? MIN_COPIES}
                          min={MIN_COPIES}
                          max={effect.maxCopies}
                          disabled={!selected}
                          onChange={(copies) => setCopies(id, copies)}
                        />
                      )}
                    </div>
                  );
                })
              ) : (
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
