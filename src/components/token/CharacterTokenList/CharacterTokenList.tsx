import { Fragment } from "react";

import { characterTokenId } from "../../../core/token/catalog/buildTokenItems";
import {
  CatalogCharacter,
  CatalogTokenSpec,
  GuildCatalog,
} from "../../../core/token/catalog/catalogTypes";
import { CheckboxField } from "../../primitives/CheckboxField/CheckboxField";
import { NumberField } from "../../primitives/NumberField/NumberField";
import { Panel } from "../../primitives/Panel/Panel";
import styles from "./CharacterTokenList.module.css";

export type CharacterTokenListProps = {
  catalog: GuildCatalog;
  selectedTokenIds: string[];
  onSelectedTokenIdsChange: (selectedTokenIds: string[]) => void;
  tokenCopies: Record<string, number>;
  onTokenCopiesChange: (tokenCopies: Record<string, number>) => void;
};

const DEFAULT_COPIES = 1;
const MIN_COPIES = 1;

const tokenIdsForCharacter = (character: CatalogCharacter): string[] => {
  return character.tokens.map((_, tokenIndex) => characterTokenId(character.id, tokenIndex));
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
        <CheckboxField
          label="Select all"
          hideLabel
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
            <Fragment key={character.id}>
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
                character.tokens.map((token: CatalogTokenSpec, tokenIndex) => {
                  const id = characterTokenId(character.id, tokenIndex);
                  const selected = selectedTokenIds.includes(id);
                  const hasCopiesField = (token.maxCopies ?? 1) > 1;

                  return (
                    <div className={`${styles.row} ${styles.rowToken}`} key={id}>
                      <CheckboxField
                        label={token.title}
                        checked={selected}
                        onChange={(checked) => toggle(id, checked)}
                      />

                      {hasCopiesField && (
                        <NumberField
                          label={`${token.title} copies`}
                          hideLabel
                          stepper
                          value={tokenCopies[id] ?? DEFAULT_COPIES}
                          min={MIN_COPIES}
                          max={token.maxCopies}
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
