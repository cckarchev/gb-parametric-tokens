import { characterTokenId } from "../../../core/token/catalog/buildBatchItems";
import { CatalogCharacter, GuildCatalog } from "../../../core/token/catalog/catalogTypes";
import { CheckboxField } from "../../primitives/CheckboxField/CheckboxField";
import { Panel } from "../../primitives/Panel/Panel";
import styles from "./CharacterTokenList.module.css";

export type CharacterTokenListProps = {
  catalog: GuildCatalog;
  selectedTokenIds: string[];
  onChange: (selectedTokenIds: string[]) => void;
};

const tokenIdsForCharacter = (character: CatalogCharacter): string[] => {
  return character.tokens.map((_, tokenIndex) => characterTokenId(character.id, tokenIndex));
};

export const CharacterTokenList = ({
  catalog,
  selectedTokenIds,
  onChange,
}: CharacterTokenListProps) => {
  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedTokenIds, id]);
      return;
    }

    onChange(selectedTokenIds.filter((selectedId) => selectedId !== id));
  };

  const toggleCharacter = (character: CatalogCharacter, checked: boolean) => {
    const ids = tokenIdsForCharacter(character);

    if (checked) {
      const withoutCharacter = selectedTokenIds.filter((id) => !ids.includes(id));

      onChange([...withoutCharacter, ...ids]);
      return;
    }

    onChange(selectedTokenIds.filter((id) => !ids.includes(id)));
  };

  const allTokenIds = catalog.characters.flatMap(tokenIdsForCharacter);
  const everyTokenSelected = allTokenIds.every((id) => selectedTokenIds.includes(id));
  const allSelected = allTokenIds.length > 0 && everyTokenSelected;

  const toggleAll = (checked: boolean) => {
    onChange(checked ? allTokenIds : []);
  };

  return (
    <Panel title="Character tokens">
      <CheckboxField
        label="Select all"
        checked={allSelected}
        onChange={toggleAll}
        disabled={allTokenIds.length === 0}
      />

      {catalog.characters.map((character) => {
        const ids = tokenIdsForCharacter(character);
        const hasTokens = ids.length > 0;
        const characterAllSelected = hasTokens && ids.every((id) => selectedTokenIds.includes(id));

        return (
          <div className={styles.character} key={character.id}>
            <div className={styles.characterHeader}>
              <strong className={hasTokens ? undefined : styles.characterNameDisabled}>
                {character.name}
              </strong>

              <CheckboxField
                label={`Select all: ${character.name}`}
                checked={characterAllSelected}
                onChange={(checked) => toggleCharacter(character, checked)}
                disabled={!hasTokens}
              />
            </div>

            {hasTokens ? (
              character.tokens.map((token, tokenIndex) => {
                const id = characterTokenId(character.id, tokenIndex);

                return (
                  <CheckboxField
                    key={id}
                    label={token.title}
                    checked={selectedTokenIds.includes(id)}
                    onChange={(checked) => toggle(id, checked)}
                  />
                );
              })
            ) : (
              <span className={styles.characterNameDisabled}>No tokens</span>
            )}
          </div>
        );
      })}
    </Panel>
  );
};
