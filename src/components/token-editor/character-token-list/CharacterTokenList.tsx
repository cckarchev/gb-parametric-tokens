import { Panel } from "@/components/primitives/panel/Panel";
import { SelectAllCheckbox } from "@/components/primitives/SelectAllCheckbox";
import type {
  CatalogCharacter,
  GuildCatalog,
} from "@/core/token/catalog/catalogTypes";
import { characterSelectableIds } from "@/core/token/catalog/characterSelectableIds";

import { CharacterRows } from "./CharacterRows";
import styles from "./CharacterTokenList.module.css";

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
  const toggleToken = (id: string, checked: boolean) => {
    if (checked) {
      onSelectedTokenIdsChange([...selectedTokenIds, id]);
      return;
    }

    onSelectedTokenIdsChange(
      selectedTokenIds.filter((selectedId) => selectedId !== id),
    );
  };

  const toggleCharacter = (character: CatalogCharacter, checked: boolean) => {
    const ids = characterSelectableIds(character);
    const withoutCharacter = selectedTokenIds.filter((id) => !ids.includes(id));

    if (checked) {
      onSelectedTokenIdsChange([...withoutCharacter, ...ids]);
      return;
    }

    onSelectedTokenIdsChange(withoutCharacter);
  };

  const allTokenIds = catalog.characters.flatMap(characterSelectableIds);
  const everyTokenSelected = allTokenIds.every((id) =>
    selectedTokenIds.includes(id),
  );
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
      }
    >
      {/* One flat list of rows (character headers and their tokens as direct
          siblings, not nested per character) so the zebra striping below
          alternates continuously across the whole table instead of resetting
          inside each character's own token group. */}
      <div className={styles.rows}>
        {catalog.characters.map((character) => (
          <CharacterRows
            key={character.name}
            character={character}
            selectedTokenIds={selectedTokenIds}
            tokenCopies={tokenCopies}
            onToggleCharacter={(checked) => toggleCharacter(character, checked)}
            onToggleToken={toggleToken}
            onCopiesChange={setCopies}
          />
        ))}
      </div>
    </Panel>
  );
};
