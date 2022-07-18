import { createChainable } from "./chain.js";
import { Flag } from "./types.js";

let currDescriptionContext: string[] | undefined;
let currFlagsContext: Flag | undefined;

export const describe = createChainable(["skip", "only", "todo"], function (desc: string, fn: () => void) {
  currDescriptionContext = currDescriptionContext || [];
  if ((this.only || this.skip || this.todo) && !currFlagsContext) {
    currFlagsContext = this.only ? "only" : this.skip ? "skip" : this.todo ? "todo" : undefined;
  }

  currDescriptionContext.push(desc);
  fn();
});

export const test = createChainable(
  ["skip", "only", "todo"],
  function (desc: string, fn: (() => void) | (() => Promise<void>)) {
    __TEST_MANAGER__.addTest({
      fn,
      description: (currDescriptionContext || []).concat(desc),
      flag: currFlagsContext,
    });

    currDescriptionContext = undefined;
    currFlagsContext = undefined;
  },
);

export const it = test;
