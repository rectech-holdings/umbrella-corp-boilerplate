const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const findWorkspacePackages = require("@pnpm/find-workspace-packages").default;
const findWorkspaceDir = require("@pnpm/find-workspace-dir").default;

async function getWorkspaceInfo() {
  const orig = console.error;
  console.error = () => {}; //Prevent logging some annoying errors...
  const workspaceDir = await findWorkspaceDir(process.cwd());
  const packages = await findWorkspacePackages(workspaceDir);
  console.error = orig;
  return packages.map((a) => a.manifest.name);
}

module.exports = async function (env, argv) {
  const workspacePackages = await getWorkspaceInfo();

  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: { dangerouslyAddModulePathsToTranspile: workspacePackages },
    },
    argv,
  );

  // Customize the config before returning it.
  return config;
};
