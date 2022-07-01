import { build } from "esbuild";
import { watch } from "chokidar";
import { compileEJSFileToDist, ejsFiles, esbuildConfig } from "./build.mjs";

//ESBuild Watcher
build({ ...esbuildConfig, watch: true });

//EJS Watcher
const watcher = watch(ejsFiles);
watcher.on("all", (evt, path) => {
  compileEJSFileToDist(path);
});
