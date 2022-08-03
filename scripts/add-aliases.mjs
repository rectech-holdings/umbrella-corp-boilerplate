//Little script that creates aliases for all the workspace packages folders
import fs from "fs";
import chalk from "chalk";
import os from "os";
import _ from "lodash";
import { getWorkspaceInfo } from "./utils/getWorkspaceInfo.mjs";
import path from "path";
import yesno from "yesno";

const packages = await getWorkspaceInfo();

const packageInfoArr = Object.keys(packages).map((name) => {
  const nameWODashes = name.replace(/-/g, "");

  const thisLocation = packages[name].location;
  const thisPath = path.join(thisLocation);
  return {
    name,
    alias: `alias ${nameWODashes}='cd ${thisPath}'`,
    devalias: thisLocation.match(/shared/)
      ? null
      : `alias dev${nameWODashes}='(cd ${process.cwd()} && pnpm turbo run dev --filter ${name}... --concurrency=9999)'`,
  };
});

const rootPkgName = JSON.parse(fs.readFileSync("package.json").toString()).name;

packageInfoArr.unshift({
  name: rootPkgName,
  alias: `alias ${rootPkgName
    .split("-")
    .map((a) => a[0])
    .join("")}='cd ${process.cwd()}'`,
  devalias: "",
});

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

const aliases = _(packageInfoArr)
  .map((a) => [a.alias, a.devalias].filter((b) => b))
  .flatten()
  .value();

const yes = await yesno({
  question: chalk.yellow(`Okay to add ${aliases.length} aliases to your ${terminalFiles[0]}? (y/n)`),
});

const writePath = path.join(os.homedir(), terminalFiles[0]);

if (yes) {
  const fileWOPrev = String(fs.readFileSync(writePath))
    .replace(new RegExp(`${START_DELIMITER}[\\S\\s]*${END_DELIMITER}`), "")
    .trimEnd();

  const newFile =
    fileWOPrev + "\n\n" + [START_DELIMITER, `#compdef ${aliases.join(" ")}`, ...aliases, END_DELIMITER].join("\n");

  fs.writeFileSync(writePath, newFile);

  console.info(
    [
      chalk.yellow("Wrote aliases!\n"),
      ...aliases,
      chalk.yellow(`\nCall "source ~/${terminalFiles[0]}" to load the aliases to your current shell session.`),
    ].join("\n"),
  );
}
