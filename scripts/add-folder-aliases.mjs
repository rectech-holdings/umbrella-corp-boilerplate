//Little script that creates aliases for all the workspace packages folders
import fs from "fs";
import chalk from "chalk";
import os from "os";
import _ from "lodash";
import { getWorkspaceInfo } from "./utils/getWorkspaceInfo.mjs";
import path from "path";
import yesno from "yesno";

const packages = await getWorkspaceInfo();

const aliases = Object.keys(packages).map((name) => [name.replace(/-/g, ""), path.join(packages[name].location)]);

const rootAlias = JSON.parse(fs.readFileSync("package.json"))
  .name.split("-")
  .map((a) => a[0])
  .join("");

aliases.unshift([rootAlias, process.cwd()]);

const orderedTerminalFiles = [".zshrc", ".zprofile", ".bashrc", ".bash_profile", ".profile"];
const terminalFiles = _(fs.readdirSync(os.homedir()))
  .filter((a) => orderedTerminalFiles.includes(a))
  .orderBy((a) => orderedTerminalFiles.indexOf(a), "asc")
  .value();

if (!terminalFiles.length) {
  console.error("Unable to detect file to add aliases to! Ensure you have a .bashrc or .zshrc at your home folder");
  process.exit(1);
}

const START_DELIMITER = "##### UMBRELLA CORP FOLDER ALIASES #####";
const END_DELIMITER = "##### END UMBRELLA CORP FOLDER ALIASES #####";

const yes = await yesno({
  question: chalk.yellow(`Okay to add ${aliases.length + 1} aliases to your ${terminalFiles[0]}? (y/n)`),
});

const writePath = path.join(os.homedir(), terminalFiles[0]);

if (yes) {
  const fileWOPrev = String(fs.readFileSync(writePath))
    .replace(new RegExp(`${START_DELIMITER}[\\S\\s]*${END_DELIMITER}`), "")
    .trimEnd();

  const aliasCommands = aliases.map((a) => `alias ${a[0]}='cd ${a[1]}'`);

  const newFile =
    fileWOPrev +
    "\n\n" +
    [START_DELIMITER, `#compdef ${aliases.map((a) => a[0]).join(" ")}`, ...aliasCommands, END_DELIMITER].join("\n");

  fs.writeFileSync(writePath, newFile);

  console.info(
    [
      chalk.yellow("Wrote aliases!\n"),
      ...aliasCommands,
      chalk.yellow(`\nCall "source ~/${terminalFiles[0]}" to load the aliases to your current shell session.`),
    ].join("\n"),
  );
}
