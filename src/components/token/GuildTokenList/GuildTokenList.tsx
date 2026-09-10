import { CounterSelection } from "../../../core/token/catalog/buildTokenItems";
import { GuildCatalog } from "../../../core/token/catalog/catalogTypes";
import { CheckboxField } from "../../primitives/CheckboxField/CheckboxField";
import { Panel } from "../../primitives/Panel/Panel";
import { CounterCountField } from "../CounterCountField/CounterCountField";

export type GuildTokenListProps = {
  catalog: GuildCatalog;
  genericTokens: Record<string, CounterSelection>;
  onGenericTokensChange: (genericTokens: Record<string, CounterSelection>) => void;
  influence: CounterSelection;
  onInfluenceChange: (influence: CounterSelection) => void;
  momentum: CounterSelection;
  onMomentumChange: (momentum: CounterSelection) => void;
  goalInfluence: CounterSelection;
  onGoalInfluenceChange: (goalInfluence: CounterSelection) => void;
};

const MIN_COPIES = 1;
const MAX_COPIES = 20;
const MAX_GOAL_INFLUENCE_COPIES = 2;
const DEFAULT_GENERIC_COUNTER: CounterSelection = { enabled: false, copies: MIN_COPIES };

export const GuildTokenList = ({
  catalog,
  genericTokens,
  onGenericTokensChange,
  influence,
  onInfluenceChange,
  momentum,
  onMomentumChange,
  goalInfluence,
  onGoalInfluenceChange,
}: GuildTokenListProps) => {
  const setGenericCounter = (id: string, counter: CounterSelection) => {
    onGenericTokensChange({ ...genericTokens, [id]: counter });
  };

  const genericIds = catalog.genericTokens.map((generic) => generic.name);
  const allEnabled =
    influence.enabled &&
    momentum.enabled &&
    goalInfluence.enabled &&
    genericIds.every((id) => genericTokens[id]?.enabled);

  // Only ever flips `enabled` -- every counter's own copies count (default or already chosen)
  // is left exactly as it was, on or off, so toggling this twice in a row is a no-op on the
  // numbers themselves.
  const toggleAll = (enabled: boolean) => {
    onInfluenceChange({ ...influence, enabled });
    onMomentumChange({ ...momentum, enabled });
    onGoalInfluenceChange({ ...goalInfluence, enabled });

    const nextGenericTokens = { ...genericTokens };

    for (const id of genericIds) {
      nextGenericTokens[id] = { ...(genericTokens[id] ?? DEFAULT_GENERIC_COUNTER), enabled };
    }

    onGenericTokensChange(nextGenericTokens);
  };

  return (
    <Panel
      title="Guild tokens"
      headerAccessory={
        <CheckboxField label="Select all" hideLabel checked={allEnabled} onChange={toggleAll} />
      }>
      <CounterCountField
        label="Influence tokens"
        enabled={influence.enabled}
        onEnabledChange={(enabled) => onInfluenceChange({ ...influence, enabled })}
        copies={influence.copies}
        onCopiesChange={(copies) => onInfluenceChange({ ...influence, copies })}
        min={MIN_COPIES}
        max={MAX_COPIES}
      />

      <CounterCountField
        label="Momentum tokens"
        enabled={momentum.enabled}
        onEnabledChange={(enabled) => onMomentumChange({ ...momentum, enabled })}
        copies={momentum.copies}
        onCopiesChange={(copies) => onMomentumChange({ ...momentum, copies })}
        min={MIN_COPIES}
        max={MAX_COPIES}
      />

      <CounterCountField
        label="Goal Influence tokens"
        enabled={goalInfluence.enabled}
        onEnabledChange={(enabled) => onGoalInfluenceChange({ ...goalInfluence, enabled })}
        copies={goalInfluence.copies}
        onCopiesChange={(copies) => onGoalInfluenceChange({ ...goalInfluence, copies })}
        min={MIN_COPIES}
        max={MAX_GOAL_INFLUENCE_COPIES}
      />

      {catalog.genericTokens.map((generic) => {
        const counter = genericTokens[generic.name] ?? DEFAULT_GENERIC_COUNTER;

        return (
          <CounterCountField
            key={generic.name}
            label={generic.name}
            enabled={counter.enabled}
            onEnabledChange={(enabled) => setGenericCounter(generic.name, { ...counter, enabled })}
            copies={counter.copies}
            onCopiesChange={(copies) => setGenericCounter(generic.name, { ...counter, copies })}
            min={MIN_COPIES}
            max={MAX_COPIES}
          />
        );
      })}
    </Panel>
  );
};
