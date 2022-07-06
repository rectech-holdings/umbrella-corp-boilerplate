import { execaCommand } from "execa";
import yesno from "yesno";
import chalk from "chalk";
import replaceInFile from "replace-in-file";
import { globbySync } from "globby";
import fs from "fs";
import { getWorkspaceInfo } from "./utils/utils.mjs";
import semver from "semver";
import _ from "lodash";
import isCI from "is-ci";

//Don't run this script if we're adding packages. Too flaky.
if (process.env["npm_config_argv"] && JSON.parse(process.env["npm_config_argv"]).original?.[0] === "add") {
  process.exit(0);
}

const workspacePackages = Object.keys(await getWorkspaceInfo());
const ensureNoDifferentVersionsMap = {};
const shouldPromptForRecovery = !isCI && process.argv[2] !== "--non-interactive";

let errors = [];
const files = globbySync("**/*/package.json", { gitignore: true, followSymbolicLinks: false });

files.forEach((file) => {
  const pkgJson = readJSON(file);
  const pkgName = pkgJson.name;
  if (isWorkspacePackage(pkgName)) {
    const deps = {
      dependencies: pkgJson.dependencies || {},
      devDependencies: pkgJson.devDependencies || {},
    };

    const duplicates = [..._.intersection(Object.keys(deps.dependencies), Object.keys(deps.devDependencies))];
    if (duplicates.length) {
      errors.push({
        msg: `Error in ${pkgName}. The packages "${duplicates.toString()}" are declared more than once across "dependencies", "devDependencies", and "peerDependencies". Please fix this issue in ${file}`,
      });
    }

    Object.keys(deps).forEach((depType) => {
      Object.entries(deps[depType]).forEach(([dep, version]) => {
        //Ensure no semver ranges. They are abomination
        if (!String(version[0]).match(/\d/) && version[0] !== "*" && version !== "*") {
          const msg = `Semver range (e.g. ^ or ~) detected in package.json of ${pkgName}: "${dep}": "${version}". This is prohibited in this monorepo in order to prevent version duplication.`;

          throw new Error(msg);
        }

        //Ensure local package dependencies have a version of "*"
        if (isWorkspacePackage(dep) && version !== "*") {
          const msg = `Dependency in ${pkgName} for local package "${dep}" must be "*", not "${version}".`;
          errors.push({
            msg,
            recoveryPrompt: async () => {
              const yes = await yesno({
                question: [msg, `Would you like to upgrade from "${version}" to "*"? (y/n)`].join(" "),
                defaultValue: null,
              });

              if (yes) {
                await replaceInFile({
                  to: `"${dep}": "*"`,
                  from: `"${dep}": "${version}"`,
                  files: "**/*/package.json",
                  ignore: ["node_modules"],
                });
                return true;
              } else {
                return false;
              }
            },
          });
        }

        //Ensure versions are identical across all packages.
        const priorVersion = ensureNoDifferentVersionsMap[dep];
        if (priorVersion && priorVersion.version !== version) {
          const higherVersion = semver.gt(priorVersion.version, version) ? priorVersion.version : version;
          const lowerVersion = higherVersion === version ? priorVersion.version : version;

          const msg = `The packages ${pkgJson.name} and ${priorVersion.name} are on different versions of ${dep}.`;
          errors.push({
            msg,
            recoveryPrompt: async () => {
              const yes = await yesno({
                question: [
                  msg,
                  `Would you like to upgrade ${dep} from "${lowerVersion}" to "${higherVersion}"? (y/n)`,
                ].join(" "),
                defaultValue: null,
              });

              if (yes) {
                await replaceInFile({
                  to: `"${dep}": "${higherVersion}"`,
                  from: `"${dep}": "${lowerVersion}"`,
                  files: ["**/*/package.json", "package.json"],
                  ignore: ["node_modules"],
                });
                return true;
              } else {
                return false;
              }
            },
          });
        }

        ensureNoDifferentVersionsMap[dep] = {
          version,
          name: pkgJson.name,
          depType,
          filePath: file,
        };
      });
    });
  }
});

if (errors.length) {
  if (!shouldPromptForRecovery) {
    errors.map((a) => console.error(chalk.red(a.msg)));
    process.exit(1);
  }

  errors = _.orderBy(errors, (a) => Number(!!a.recoveryPrompt), "desc");
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
    await execaCommand("yarn install", {
      buffer: false,
      shell: true,
      stdout: process.stdout,
      stderr: process.stderr,
      stdin: process.stdin,
    });
  }
}

function isWorkspacePackage(pkgName) {
  return workspacePackages.includes(pkgName);
}

function readJSON(filePath) {
  return JSON.parse(String(fs.readFileSync(filePath)));
}

console.info("Monorepo configuration is good 👍");
