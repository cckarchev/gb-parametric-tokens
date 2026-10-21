import { describe, expect, it, vi } from "vitest";

import type { CounterRow } from "./counter-panel/CounterPanel";
import { setRowsEnabled } from "./setRowsEnabled";

const MAX_COPIES = 6;

const buildRow = (
  key: string,
  enabled: boolean,
  copies: number,
): CounterRow => ({
  key,
  label: key,
  selection: { enabled, copies },
  onChange: vi.fn(),
  maxCopies: MAX_COPIES,
});

describe("setRowsEnabled", () => {
  it("flips every row's enabled flag and keeps its copies", () => {
    const rows = [buildRow("a", false, 3), buildRow("b", true, 1)];

    const next = setRowsEnabled({}, rows, true);

    expect(next).toEqual({
      a: { enabled: true, copies: 3 },
      b: { enabled: true, copies: 1 },
    });
  });

  it("keeps record entries that have no row and leaves the input untouched", () => {
    const record = { other: { enabled: true, copies: 2 } };

    const next = setRowsEnabled(record, [buildRow("a", true, 4)], false);

    expect(next).toEqual({
      other: { enabled: true, copies: 2 },
      a: { enabled: false, copies: 4 },
    });
    expect(record).toEqual({ other: { enabled: true, copies: 2 } });
  });
});
