import { Panel } from "@/components/primitives/panel/Panel";
import { SelectAllCheckbox } from "@/components/primitives/SelectAllCheckbox";
import {
  type CounterSelection,
  MIN_COPIES,
} from "@/core/token/catalog/token-items/tokenItem";

import { CountField } from "./CountField";

// One checkbox-plus-copies row, whatever selection field it is backed by.
export type CounterRow = {
  key: string;
  label: string;
  selection: CounterSelection;
  onChange: (selection: CounterSelection) => void;
  maxCopies: number;
};

type CounterPanelProps = {
  title: string;
  rows: CounterRow[];
  // Left to the caller: rows backed by the same record have to be written in
  // one batched call, which only the caller knows how to group.
  onToggleAll: (enabled: boolean) => void;
};

export const CounterPanel = ({
  title,
  rows,
  onToggleAll,
}: CounterPanelProps) => {
  const allEnabled = rows.every((row) => row.selection.enabled);

  return (
    <Panel
      title={title}
      headerAccessory={
        <SelectAllCheckbox checked={allEnabled} onChange={onToggleAll} />
      }
    >
      {rows.map((row) => (
        <CountField
          key={row.key}
          label={row.label}
          enabled={row.selection.enabled}
          onEnabledChange={(enabled) =>
            row.onChange({ ...row.selection, enabled })
          }
          copies={row.selection.copies}
          onCopiesChange={(copies) =>
            row.onChange({ ...row.selection, copies })
          }
          min={MIN_COPIES}
          max={row.maxCopies}
        />
      ))}
    </Panel>
  );
};
