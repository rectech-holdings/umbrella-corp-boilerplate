import { execaCommand } from "execa";
import yesno from "yesno";
import replaceInFile from "replace-in-file";
import { globbySync } from "globby";
import fs from "fs";
import semver from "semver";
import _ from "lodash";
const ensureNoDifferentVersionsMap = {};

//Don't run this script if we're adding packages. Too flaky.
if (process.env["npm_config_argv"] && JSON.parse(process.env["npm_config_argv"]).original?.[0] === "add") {
  process.exit(0);
}

const workspacePackages = await (async function getWorkspacePackageNames() {
  if (!getWorkspacePackageNames.cached) {
    try {
      const val = Object.keys(
        JSON.parse((await execaCommand(`yarn workspaces info`)).stdout.split("\n").slice(1, -1).join(""))
      );
      getWorkspacePackageNames.cached = val;
    } catch (e) {
      throw new Error("Unable to get yarn workspaces info. The output format has likely changed...");
    }
  }

  return getWorkspacePackageNames.cached;
})();

let errors = [];

const files = globbySync(["**/*/package.json"], { gitignore: true });
files.forEach((file) => {
  const pkgJson = JSON.parse(String(fs.readFileSync(file)));
  const pkgName = pkgJson.name;
  if (isWorkspacePackage(pkgName)) {
    const deps = {
      dependencies: pkgJson.dependencies || {},
      devDependencies: pkgJson.devDependencies || {},
      peerDependencies: pkgJson.peerDependencies || {},
    };

    //Ensure the same module is not declared twice in different dependency types (dependencies, devDependencies, or peerDependencies)
    const duplicates = [
      ..._.intersection(Object.keys(deps.dependencies), Object.keys(deps.devDependencies)),
      ..._.intersection(Object.keys(deps.dependencies), Object.keys(deps.peerDependencies)),
      ..._.intersection(Object.keys(deps.devDependencies), Object.keys(deps.peerDependencies)),
    ];
    if (duplicates.length) {
      errors.push({
        msg: `Error in ${pkgName}. The packages "${duplicates.toString()}" are declared more than once across "dependencies", "devDependencies", and "peerDependencies". Please fix this issue in ${file}`,
      });
    }

    Object.keys(deps).forEach((depType) => {
      Object.entries(deps[depType]).forEach(([dep, version]) => {
        //Ensure no semver ranges. They are abomination
        if (!String(version[0]).match(/\d/) && version[0] !== "*" && version !== "*") {
          errors.push({
            msg: `Semver range (e.g. ^ or ~) detected in package.json of ${pkgName}: "${dep}": "${version}". This is prohibited in this monorepo in order to prevent version duplication.`,
          });
        }

        //Ensure local package dependencies have a version of "*"
        if (isWorkspacePackage(dep) && version !== "*") {
          errors.push({
            recoveryPrompt: async () => {
              const yes = await yesno({
                question: `Dependency in ${pkgName} for local package "${dep}" must be "*", not "${version}". Would you like to upgrade from "${version}" to "*"? (y/n)`,
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

          errors.push({
            recoveryPrompt: async () => {
              const yes = await yesno({
                question: `The packages ${pkgJson.name} and ${priorVersion.name} are on different versions of ${dep}: ${version} and ${priorVersion.version}. Would you like to upgrade ${dep} from "${priorVersion.version}" to "${higherVersion}"? (y/n)`,
                defaultValue: null,
              });

              if (yes) {
                await replaceInFile({
                  to: `"${dep}": "${higherVersion}"`,
                  from: `"${dep}": "${priorVersion.version}"`,
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
  errors = _.orderBy(errors, (a) => Number(!!a.recoveryPrompt), "desc");
  let shouldThrow = false;
  let shouldReinstall = false;
  for (let i = 0; i < errors.length; i++) {
    const { msg, recoveryPrompt } = errors[i];
    if (msg) {
      console.error("\n\n" + msg + "\n\n");
    } else if (recoveryPrompt) {
      const didRecover = await recoveryPrompt();
      if (didRecover) {
        shouldReinstall = true;
      } else {
        shouldThrow = true;
      }
    } else {
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
