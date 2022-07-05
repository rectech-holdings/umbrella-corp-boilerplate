import { execaCommand } from "execa";

export async function getWorkspaceInfo() {
  if (!getWorkspaceInfo.cached) {
    try {
      const val = JSON.parse((await execaCommand(`yarn workspaces info`)).stdout.split("\n").slice(1, -1).join(""));
      getWorkspaceInfo.cached = val;
    } catch (e) {
      console.error(e);
      throw new Error("Unable to get yarn workspaces info. The output format has likely changed...");
    }
  }

  return getWorkspaceInfo.cached;
}
