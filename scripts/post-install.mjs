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
  //Gotta limit line output to 80 characters. PNPM cuts off git hook output instead of wrapping it...
  errors.map((a) => console.error(chalk.red(a.msg.match(/.{1,80}/g).join("\n "))));

  process.exit(1);
}

console.info("Monorepo configuration is good 👍");
