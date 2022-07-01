import { execaCommand } from "execa";

import { globbySync } from "globby";
import fs from "fs";
import semver from "semver";
import _ from "lodash";
const ensureNoDifferentVersionsMap = {};

//Don't run this script if we're adding packages. Too flaky.
if (process.env["npm_config_argv"] && JSON.parse(process.env["npm_config_argv"]).original?.[0] === "add") {
  process.exit(0);
}

const files = globbySync(["**/*/package.json"], { gitignore: true });
files.forEach((file) => {
  const pkgJson = JSON.parse(String(fs.readFileSync(file)));
  const pkgName = pkgJson.name;
  if (pkgName.indexOf("@umbrella-corp/") === 0) {
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
      console.error(
        `\n\nError in ${pkgName}. The packages \`${duplicates.toString()}\` are declared more than once across \`dependencies\`, \`devDependencies\`, and \`peerDependencies\`. Please fix this issue in ${file}\n\n`
      );
      process.exit(1);
    }

    Object.keys(deps).forEach((depType) => {
      Object.entries(deps[depType]).forEach(([dep, version]) => {
        //Ensure no semver ranges. They are abomination
        if (!String(version[0]).match(/\d/) && version[0] !== "*" && version !== "*") {
          console.error(
            `Semver range (e.g. ^ or ~) detected in package.json of ${pkgName}: "${dep}": "${version}". This is prohibited in this monorepo in order to prevent version duplication.`
          );
          process.exit(1);
        }

        //Ensure local package dependencies have a version of "*"
        if (dep.indexOf("@umbrella-corp/") === 0 && version !== "*") {
          console.error(
            `Local dependency in package.json ${pkgName} for package ${dep} must be "*", not "${version}". At project root, please run:\n\nnpx replace-in-files-cli --string='"${dep}": "${version}"' --replacement='"${dep}": "*"' '*/**' '!node_modules'`
          );
          process.exit(1);
        }

        //Ensure versions are identical across all packages.
        const priorVersion = ensureNoDifferentVersionsMap[dep];
        if (priorVersion && priorVersion.version !== version) {
          const higherVersion = semver.gt(priorVersion.version, version) ? priorVersion.version : version;

          const safeDepName = dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          console.error(
            `The packages ${pkgJson.name} and ${priorVersion.name} are on different versions of ${dep}: ${version} and ${priorVersion.version}.\n
Please upgrade this package globally across the monorepo by running\n
npx replace-in-files-cli --regex='"${safeDepName}": "[^"]+"' --replacement='"${dep}": "${higherVersion}"' '*/**/package.json' '!node_modules' && yarn install\n\n`
          );

          process.exit(1);
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

async function getWorkspacePackageNames() {
  try {
    return Object.keys(
      JSON.parse((await execaCommand(`yarn workspaces info`)).stdout.split("\n").slice(1, -1).join(""))
    );
  } catch (e) {
    throw new Error("Unable to get yarn workspaces info. The output format has likely changed...");
  }
}
