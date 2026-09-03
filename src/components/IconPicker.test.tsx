// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ManifestEntry } from "../core/token/icons/iconManifest";
import { IconPicker } from "./IconPicker";

const baseEntry = {
  pathCount: 1,
  bbox: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
  aspect: 1,
  needsUnion: false,
  overflowsEmBox: false,
};

const manifest: ManifestEntry[] = [
  { id: "brewers", kind: "guild", ...baseEntry },
  { id: "influence", kind: "status", ...baseEntry },
];

describe("IconPicker", () => {
  it("groups options by kind and includes a none option", () => {
    render(<IconPicker manifest={manifest} value={undefined} onChange={vi.fn()} />);

    expect(screen.getByRole("option", { name: "(none)" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Guilds" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "brewers" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "influence" })).toBeInTheDocument();
  });

  it("does not preview an image when no icon is selected", () => {
    render(<IconPicker manifest={manifest} value={undefined} onChange={vi.fn()} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("previews the selected icon", () => {
    render(<IconPicker manifest={manifest} value="brewers" onChange={vi.fn()} />);

    expect(screen.getByRole("img", { name: "brewers" })).toHaveAttribute(
      "src",
      "/icons/brewers.svg",
    );
  });

  it("reports undefined when the none option is chosen", async () => {
    const onChange = vi.fn();

    render(<IconPicker manifest={manifest} value="brewers" onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Icon"), "(none)");

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
