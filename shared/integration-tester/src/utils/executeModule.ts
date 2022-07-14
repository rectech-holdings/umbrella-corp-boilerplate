import { VMScriptRunner } from "@miniflare/runner-vm";
import { createDOMContext } from "./createDOMContext.js";
import fs from "fs";
const runner = new VMScriptRunner();

export async function executeModule(absPath: string): Promise<string> {
  const ctx = createDOMContext();
  await runner.run(
    ctx,
    {
      code: fs.readFileSync(absPath).toString(),
      filePath: absPath,
    },
    [{ type: "ESModule", include: /\.js$/ }],
  );

  return ctx["_$_$_TEST_RESULT_$_$_"] as string;
}
