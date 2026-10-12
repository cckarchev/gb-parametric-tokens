// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("./components/token/TokenEditor/TokenEditor", () => ({
  TokenEditor: () => <p>Token editor</p>,
}));

const { App } = await import("./App");

describe("App", () => {
  it("renders the token editor", () => {
    render(<App />);

    expect(screen.getByText("Token editor")).toBeInTheDocument();
  });

  it("takes the header's logo and app name back home, announcing it like back/forward would", async () => {
    window.history.replaceState(null, "", "/guild/brewers");
    const onPopState = vi.fn();

    render(<App />);

    window.addEventListener("popstate", onPopState);
    await userEvent.click(screen.getByRole("link", { name: "Guild Ball Parametric Tokens" }));
    window.removeEventListener("popstate", onPopState);

    expect(window.location.pathname).toBe("/");
    expect(onPopState).toHaveBeenCalledTimes(1);
  });
});
