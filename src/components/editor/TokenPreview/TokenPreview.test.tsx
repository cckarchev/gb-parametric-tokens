// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColorGroupSpec, ShapeSpec } from "../../../core/token/types";
import { TokenPreview } from "./TokenPreview";

const discShape: ShapeSpec = { type: "disc", diameterMm: 40 };
const colorGroups: ColorGroupSpec[] = [
  { id: "base", name: "Body", color: "#2B2B2B" },
  { id: "text", name: "Text & symbols", color: "#F5F0E1" },
];

describe("TokenPreview", () => {
  it("shows a loading message before the base outline resolves", () => {
    render(<TokenPreview shape={discShape} reliefComponents={[]} colorGroups={colorGroups} />);

    expect(screen.getByText("Rendering preview...")).toBeInTheDocument();
  });

  it("renders the SVG preview once the base outline resolves", async () => {
    render(<TokenPreview shape={discShape} reliefComponents={[]} colorGroups={colorGroups} />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Token preview" })).toBeInTheDocument();
    });

    const container = screen.getByRole("img", { name: "Token preview" });

    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("includes the relief contours as an extra path on top of the base outline", async () => {
    const reliefComponents = [
      {
        contours: [
          [
            [0, 0],
            [5, 0],
            [5, 5],
            [0, 5],
          ] as [number, number][],
        ],
        colorGroup: "base",
      },
    ];

    render(
      <TokenPreview
        shape={discShape}
        reliefComponents={reliefComponents}
        colorGroups={colorGroups}
      />,
    );

    await waitFor(() => {
      const container = screen.getByRole("img", { name: "Token preview" });

      // Base + relief contours, plus the non-printing grid overlay's own path.
      expect(container.querySelectorAll("path").length).toBe(3);
    });
  });
});
