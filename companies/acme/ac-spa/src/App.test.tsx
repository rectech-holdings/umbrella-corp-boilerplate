import { create } from "react-test-renderer";
import { inspect } from "util";
import App from "./App.js";

describe("suite", () => {
  it("does something!", async () => {
    console.log(inspect(create(<App />).toJSON(), false, 9999));
  });
});
