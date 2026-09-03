import { describe, expect, it } from "vitest";

import { extractPathData } from "./extractPathData";

describe("extractPathData", () => {
  it("pulls the d attribute out of every <path> element", () => {
    const svg = `<svg><g><path style="fill:#000" d="M0 0 L1 1 Z" id="a"/></g><path d="M2 2 Z"/></svg>`;

    expect(extractPathData(svg)).toEqual(["M0 0 L1 1 Z", "M2 2 Z"]);
  });

  it("ignores every non-path element, including scripts", () => {
    const svg = `<svg><script>alert(1)</script><rect x="0" y="0" width="1" height="1"/><path d="M0 0 Z"/></svg>`;

    expect(extractPathData(svg)).toEqual(["M0 0 Z"]);
  });

  it("returns an empty array when there are no paths", () => {
    expect(extractPathData("<svg></svg>")).toEqual([]);
  });
});
