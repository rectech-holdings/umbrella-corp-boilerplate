import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import App from "./App.js";

// The two tests marked with concurrent will be run in parallel
describe("suite", () => {
  it("serial test", async () => {
    render(<App />);

    expect(screen.getByRole("button").textContent).toMatch("count is");
  });
  it.concurrent("concurrent test 1", async () => {});
  it.concurrent("concurrent test 2", async () => {});
});
