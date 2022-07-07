import _ from "lodash";
import pkg1 from "@pnpm/find-workspace-packages";
import pkg2 from "@pnpm/find-workspace-dir";

const findWorkspacePackages = pkg1.default;
const findWorkspaceDir = pkg2.default;

export async function getWorkspaceInfo() {
  if (!getWorkspaceInfo.cached) {
    const orig = console.error;
    console.error = () => {}; //Prevent logging some annoying errors...
    const workspaceDir = await findWorkspaceDir(process.cwd());
    const packages = await findWorkspacePackages(workspaceDir);
    console.error = orig;
    getWorkspaceInfo.cached = _(packages)
      .mapKeys((a) => a.manifest.name)
      .mapValues((a) => ({
        location: a.dir,
      }))
      .value();
  }

  return getWorkspaceInfo.cached;
}
