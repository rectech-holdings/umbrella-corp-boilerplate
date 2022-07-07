import chalk from "chalk";
import _ from "lodash";
import { getPackageErrors } from "./utils/getPackageErrors.mjs";

//Don't run this script if we're adding packages. Too flaky.
if (process.env["npm_config_argv"] && JSON.parse(process.env["npm_config_argv"]).original?.[0] === "add") {
  process.exit(0);
}

const errors = await getPackageErrors();

if (errors.length) {
  console.error(chalk.red("Monorepo configuration errors found!"));
  errors.map((a) => console.error(chalk.red(a.msg)));
  console.error(
    chalk.yellow(
      "To fix, either run `pnpm update --interactive --latest --recursive` or `node ./scripts/fix-incorrect-deps`",
    ),
  );

  process.exit(1);
}

console.info("Monorepo configuration is good 👍");
