import type { GuildCatalog } from "@/core/token/catalog/catalogTypes";
import type { TokenSelection } from "@/core/token/catalog/token-items/tokenItem";
import type { SelectionUpdate } from "@/hooks/useGuildSelections";

import { CounterRecordList } from "./CounterRecordList";
import { CharacterTokenList } from "./character-token-list/CharacterTokenList";
import { GuildTokenList } from "./GuildTokenList";

const MAX_CONDITION_COPIES = 12;
const MAX_GAME_PLAN_COPIES = 1;

type SelectionListsProps = {
  catalog: GuildCatalog;
  selection: TokenSelection;
  setSelection: (update: SelectionUpdate) => void;
};

// The lists that pick which tokens the open guild prints.
export const SelectionLists = ({
  catalog,
  selection,
  setSelection,
}: SelectionListsProps) => {
  // Each list below owns one field of the selection. The update is functional because "Select
  // all" sets several fields in one click: built from this render's snapshot, only the last one
  // would stick.
  const updateSelectionField =
    <Field extends keyof TokenSelection>(field: Field) =>
    (value: TokenSelection[Field]) => {
      setSelection((current) => ({ ...current, [field]: value }));
    };

  // The generic catalog has no roster, and only it carries the Game Plan deck.
  const hasCharacters = catalog.characters.length > 0;
  const hasGamePlans = catalog.gamePlans.length > 0;

  return (
    <>
      {hasCharacters && (
        <CharacterTokenList
          catalog={catalog}
          selectedTokenIds={selection.characterTokenIds}
          onSelectedTokenIdsChange={updateSelectionField("characterTokenIds")}
          tokenCopies={selection.characterTokenCopies}
          onTokenCopiesChange={updateSelectionField("characterTokenCopies")}
        />
      )}

      {/* In the roster's spot: for the generic catalog, the game plans are its "models". */}
      {hasGamePlans && (
        <CounterRecordList
          title="Game Plans"
          entries={catalog.gamePlans}
          maxCopies={MAX_GAME_PLAN_COPIES}
          selection={selection.gamePlans}
          onSelectionChange={updateSelectionField("gamePlans")}
        />
      )}

      <GuildTokenList
        catalog={catalog}
        genericTokens={selection.genericTokens}
        onGenericTokensChange={updateSelectionField("genericTokens")}
        influence={selection.influence}
        onInfluenceChange={updateSelectionField("influence")}
        momentum={selection.momentum}
        onMomentumChange={updateSelectionField("momentum")}
        goalInfluence={selection.goalInfluence}
        onGoalInfluenceChange={updateSelectionField("goalInfluence")}
      />

      <CounterRecordList
        title="Conditions"
        entries={catalog.conditions}
        maxCopies={MAX_CONDITION_COPIES}
        selection={selection.conditions}
        onSelectionChange={updateSelectionField("conditions")}
      />
    </>
  );
};
