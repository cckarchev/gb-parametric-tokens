// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PRINT_PROFILES } from "../../../core/token/printProfiles";
import { PrintProfileSelector } from "./PrintProfileSelector";

describe("PrintProfileSelector", () => {
  it("lists every print profile from PRINT_PROFILES", () => {
    render(<PrintProfileSelector printProfileId="fdm-04" onChange={vi.fn()} />);

    for (const profile of Object.values(PRINT_PROFILES)) {
      expect(screen.getByRole("option", { name: profile.name })).toBeInTheDocument();
    }
  });

  it("reports the selected profile id when changed", async () => {
    const onChange = vi.fn();
    const [firstProfile, secondProfile] = Object.values(PRINT_PROFILES);

    render(<PrintProfileSelector printProfileId={firstProfile.id} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Print profile"), secondProfile.name);

    expect(onChange).toHaveBeenCalledWith(secondProfile.id);
  });
});
