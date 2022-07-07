import { execaCommand } from "execa";
import { getPackageErrors } from "./utils/getPackageErrors.mjs";

const errors = await getPackageErrors();

let shouldThrow = false;
let shouldReinstall = false;
for (let i = 0; i < errors.length; i++) {
  const { msg, recoveryPrompt } = errors[i];
  if (recoveryPrompt) {
    const didRecover = await recoveryPrompt();
    if (didRecover) {
      shouldReinstall = true;
    } else {
      shouldThrow = true;
    }
  } else if (msg) {
    console.error("\n\n" + msg + "\n\n");
    shouldThrow = true;
  }
}

if (shouldThrow) {
  process.exit(1);
}

if (shouldReinstall) {
  // await execaCommand("yarn install", {
  //   buffer: false,
  //   shell: true,
  //   stdout: process.stdout,
  //   stderr: process.stderr,
  //   stdin: process.stdin,
  // });
}
