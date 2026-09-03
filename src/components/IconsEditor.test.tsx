// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ManifestEntry } from "../core/token/icons/iconManifest";
import type { ColorGroupSpec, IconSpec } from "../core/token/types";
import { IconsEditor } from "./IconsEditor";

const baseEntry = {
  pathCount: 1,
  bbox: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
  aspect: 1,
  needsUnion: false,
  overflowsEmBox: false,
};
const manifest: ManifestEntry[] = [{ id: "brewers", kind: "guild", ...baseEntry }];
const colorGroups: ColorGroupSpec[] = [{ id: "accent", name: "Accent", color: "#ffffff" }];

describe("IconsEditor", () => {
  it("shows a single center slot for a disc shape", () => {
    render(
      <IconsEditor
        shapeType="disc"
        icons={[]}
        colorGroups={colorGroups}
        manifest={manifest}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Center icon")).toBeInTheDocument();
    expect(screen.queryByText("Left nob icon")).not.toBeInTheDocument();
  });

  it("shows left and right slots for an arc shape", () => {
    render(
      <IconsEditor
        shapeType="arc"
        icons={[]}
        colorGroups={colorGroups}
        manifest={manifest}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Left nob icon")).toBeInTheDocument();
    expect(screen.getByText("Right nob icon")).toBeInTheDocument();
  });

  it("does not show scale/color-group fields when a slot has no icon", () => {
    render(
      <IconsEditor
        shapeType="disc"
        icons={[]}
        colorGroups={colorGroups}
        manifest={manifest}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Scale")).not.toBeInTheDocument();
  });

  it("shows scale and color-group fields once a slot has an icon", () => {
    const icons: IconSpec[] = [{ iconId: "brewers", side: "center", scale: 0.7 }];

    render(
      <IconsEditor
        shapeType="disc"
        icons={icons}
        colorGroups={colorGroups}
        manifest={manifest}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Scale")).toHaveValue(0.7);
  });

  it("adds a slot with default scale when an icon is picked for an empty slot", async () => {
    const onChange = vi.fn();

    render(
      <IconsEditor
        shapeType="disc"
        icons={[]}
        colorGroups={colorGroups}
        manifest={manifest}
        onChange={onChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Icon"), "brewers");

    expect(onChange).toHaveBeenCalledWith([{ iconId: "brewers", side: "center", scale: 0.7 }]);
  });

  it("removes the slot when its icon is cleared", async () => {
    const onChange = vi.fn();
    const icons: IconSpec[] = [{ iconId: "brewers", side: "center", scale: 0.7 }];

    render(
      <IconsEditor
        shapeType="disc"
        icons={icons}
        colorGroups={colorGroups}
        manifest={manifest}
        onChange={onChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Icon"), "(none)");

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
