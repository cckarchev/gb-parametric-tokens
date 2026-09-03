import { GuildCatalog } from "../../../core/token/catalog/catalogTypes";
import { NumberField } from "../../primitives/NumberField/NumberField";
import { Panel } from "../../primitives/Panel/Panel";
import { CounterCountField } from "../CounterCountField/CounterCountField";

export type GuildTokenListProps = {
  catalog: GuildCatalog;
  genericCopies: Record<string, number>;
  onGenericCopiesChange: (genericCopies: Record<string, number>) => void;
  influenceCopies: number;
  onInfluenceCopiesChange: (influenceCopies: number) => void;
  momentumCopies: number;
  onMomentumCopiesChange: (momentumCopies: number) => void;
  goalInfluenceCopies: number;
  onGoalInfluenceCopiesChange: (goalInfluenceCopies: number) => void;
};

const MIN_COPIES = 0;
const MAX_COPIES = 6;

export const GuildTokenList = ({
  catalog,
  genericCopies,
  onGenericCopiesChange,
  influenceCopies,
  onInfluenceCopiesChange,
  momentumCopies,
  onMomentumCopiesChange,
  goalInfluenceCopies,
  onGoalInfluenceCopiesChange,
}: GuildTokenListProps) => {
  const setCopies = (id: string, copies: number) => {
    onGenericCopiesChange({ ...genericCopies, [id]: copies });
  };

  return (
    <Panel title="Guild tokens">
      <CounterCountField
        label="Influence tokens (0-20)"
        value={influenceCopies}
        onChange={onInfluenceCopiesChange}
      />

      <CounterCountField
        label="Momentum tokens (0-20)"
        value={momentumCopies}
        onChange={onMomentumCopiesChange}
      />

      <NumberField
        label="Goal Influence tokens"
        value={goalInfluenceCopies}
        min={MIN_COPIES}
        max={MAX_COPIES}
        onChange={onGoalInfluenceCopiesChange}
      />

      {catalog.genericTokens.map((generic) => (
        <NumberField
          key={generic.id}
          label={generic.name}
          value={genericCopies[generic.id] ?? 0}
          min={MIN_COPIES}
          max={MAX_COPIES}
          onChange={(copies) => setCopies(generic.id, copies)}
        />
      ))}
    </Panel>
  );
};
