import { getWorkspaceInfo } from "./getWorkspaceInfo.mjs";
import yesno from "yesno";
import replaceInFile from "replace-in-file";
import path from "path";
import { globbySync } from "globby";
import fs from "fs";
import semver from "semver";
import _ from "lodash";

const workspacePackages = Object.keys(await getWorkspaceInfo());

export async function getPackageErrors() {
  const ensureNoDifferentVersionsMap = {};

  let errors = [];
  const files = globbySync("**/package.json", { gitignore: true, followSymbolicLinks: false });

  files.forEach((pkgJsonFileRaw) => {
    const pkgJsonFile = path.join(process.cwd(), pkgJsonFileRaw);
    const pkgJson = readJSON(pkgJsonFile);
    const pkgName = pkgJson.name;
    if (isWorkspacePackage(pkgName)) {
      //TODO: Check for required scripts like "dev", "build:ts", etc

      const deps = {
        dependencies: pkgJson.dependencies || {},
        devDependencies: pkgJson.devDependencies || {},
      };

      const duplicates = [..._.intersection(Object.keys(deps.dependencies), Object.keys(deps.devDependencies))];
      if (duplicates.length) {
        errors.push({
          msg: `Error in ${pkgJsonFile}. The packages "${duplicates.toString()}" are declared more than once across "dependencies", "devDependencies", and "peerDependencies"`,
        });
      }

      Object.keys(deps).forEach((depType) => {
        Object.entries(deps[depType]).forEach(([dep, version]) => {
          //Ensure no semver ranges. They are abomination
          if (!String(version[0]).match(/\d/) && version[0] !== "workspace:*" && version !== "workspace:*") {
            const msg = `Semver range (e.g. ^ or ~) detected in package.json of ${pkgName}: "${dep}": "${version}". This is prohibited in this monorepo in order to prevent version duplication.`;

            errors.push({
              msg,
              recoveryPrompt: async () => {
                const nonSemverVersion = version.substring(1);
                const yes = await yesno({
                  question: [msg, `Would you like to change "${version}" to "${nonSemverVersion}"? (y/n)`].join(" "),
                  defaultValue: null,
                });

                if (yes) {
                  await replaceInFile({
                    to: `"${dep}": "${nonSemverVersion}"`,
                    from: `"${dep}": "${version}"`,
                    files: [pkgJsonFile, `**/${priorVersion.name}/package.json`],
                  });

                  return true;
                } else {
                  return false;
                }
              },
            });
          }

          const priorVersion = ensureNoDifferentVersionsMap[dep];

          //Ensure local package dependencies have a version of "*"
          if (isWorkspacePackage(dep) && version !== "workspace:*") {
            const msg = `Dependency in ${pkgName} for local package "${dep}" must be "workspace:*", not "${version}".`;
            errors.push({
              msg,
              recoveryPrompt: async () => {
                const yes = await yesno({
                  question: [msg, `Would you like to upgrade from "${version}" to "workspace:*"? (y/n)`].join(" "),
                  defaultValue: null,
                });

                if (yes) {
                  await replaceInFile({
                    to: `"${dep}": "workspace:*"`,
                    from: `"${dep}": "${version}"`,
                    files: [pkgJsonFile, `**/${priorVersion.name}/package.json`],
                  });
                  return true;
                } else {
                  return false;
                }
              },
            });
          } else if (priorVersion && priorVersion.version !== version) {
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
                    files: [pkgJsonFile, `**/${priorVersion.name}/package.json`],
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
            filePath: pkgJsonFile,
          };
        });
      });
    }
  });

  errors = _.orderBy(errors, (a) => Number(!!a.recoveryPrompt), "desc");

  return errors;
}

function isWorkspacePackage(pkgName) {
  return workspacePackages.includes(pkgName);
}

function readJSON(filePath) {
  return JSON.parse(String(fs.readFileSync(filePath)));
}
