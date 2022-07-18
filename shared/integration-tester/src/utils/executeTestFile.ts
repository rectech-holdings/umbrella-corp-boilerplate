import { VMScriptRunner } from "@miniflare/runner-vm";
import { createDOMContext } from "./createDOMContext.js";
import fs from "fs";
import { TestManager } from "../runtime/testManager.js";
const runner = new VMScriptRunner();

let thread = 0;
export async function executeTestFile(absPath: string): Promise<TestManager> {
  const ctx = createDOMContext();

  ctx["__TEST_MANAGER__"] = new TestManager();
  ctx["__VM_THREAD__"] = ++thread;

  await runner.run(
    ctx,
    {
      code: `${fs.readFileSync(absPath).toString()}\n;await __TEST_MANAGER__.notifyHasAddedAllTests();`,
      filePath: absPath,
    },
    [{ type: "ESModule", include: /\.js$/ }],
  );

  return ctx["__TEST_MANAGER__"];
}
