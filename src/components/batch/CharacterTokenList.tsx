import { characterTokenId } from "../../core/token/catalog/buildBatchItems";
import { GuildCatalog } from "../../core/token/catalog/catalogTypes";
import { CheckboxField } from "../primitives/CheckboxField";
import { Panel } from "../primitives/Panel";
import styles from "./CharacterTokenList.module.css";

export type CharacterTokenListProps = {
  catalog: GuildCatalog;
  selectedTokenIds: string[];
  onChange: (selectedTokenIds: string[]) => void;
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

  return (
    <Panel title="Character tokens">
      {catalog.characters.map((character) => (
        <div className={styles.character} key={character.id}>
          <strong>{character.name}</strong>
          {character.tokens.map((token, tokenIndex) => {
            const id = characterTokenId(character.id, tokenIndex);

            return (
              <CheckboxField
                key={id}
                label={token.line1}
                checked={selectedTokenIds.includes(id)}
                onChange={(checked) => toggle(id, checked)}
              />
            );
          })}
        </div>
      ))}
    </Panel>
  );
};
