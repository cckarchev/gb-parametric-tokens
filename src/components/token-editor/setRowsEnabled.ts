import { CounterSelection } from "@/core/token/catalog/tokenItems/tokenItem";

import { CounterRow } from "./counter-panel/CounterPanel";

// "Select all" over rows that all live in one selection record. They are written in one call:
// calling each row's own onChange in a loop would build every one on this render's stale
// snapshot, and only the last would survive. Only `enabled` changes, so every row keeps its
// copies count.
export const setRowsEnabled = (
  record: Record<string, CounterSelection>,
  rows: CounterRow[],
  enabled: boolean,
): Record<string, CounterSelection> => {
  const nextRecord = { ...record };

  for (const row of rows) {
    nextRecord[row.key] = { ...row.selection, enabled };
  }

  return nextRecord;
};
