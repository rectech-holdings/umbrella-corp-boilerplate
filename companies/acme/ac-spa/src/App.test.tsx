import { render, screen, fireEvent } from "@testing-library/react";

import App from "./App.js";

describe("suite", () => {
  it("does something!", async () => {
    render(<App />);
    expect(screen.queryByText("count is: 0")).toBeTruthy();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("count is: 1")).toBeTruthy();
  });
});
