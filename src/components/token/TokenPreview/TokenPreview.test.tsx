// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColorGroupSpec } from "../../../core/token/types";
import { TokenPreview } from "./TokenPreview";

const colorGroups: ColorGroupSpec[] = [{ id: "base", name: "Body", color: "#2B2B2B" }];

describe("TokenPreview", () => {
  it("shows an updating message while a preview is in flight", () => {
    render(
      <TokenPreview
        items={[]}
        isPreviewing={true}
        validCount={0}
        invalidCount={0}
        colorGroups={colorGroups}
      />,
    );

    expect(screen.getByText("Updating preview...")).toBeInTheDocument();
  });

  it("reports the valid/invalid/total counts once settled", () => {
    const items = [
      {
        id: "a",
        label: "Token A",
        shape: { type: "disc" as const, diameterMm: 10 },
        baseContours: [[[0, 0] as [number, number]]],
        reliefComponents: [],
        warnings: [],
        copies: 1,
      },
      {
        id: "b",
        label: "Token B",
        shape: { type: "disc" as const, diameterMm: 10 },
        baseContours: [[[1, 1] as [number, number]]],
        reliefComponents: [],
        warnings: [],
        copies: 1,
      },
    ];

    render(
      <TokenPreview
        items={items}
        isPreviewing={false}
        validCount={1}
        invalidCount={1}
        colorGroups={colorGroups}
      />,
    );

    expect(screen.getByText("1 valid, 1 invalid of 2 tokens.")).toBeInTheDocument();
  });
});
