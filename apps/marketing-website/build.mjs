import { build } from "esbuild";
import fs, { existsSync, mkdirSync } from "fs";
import path from "path";
import ejs from "ejs";
import { globbySync } from "globby";
import browserslist from "browserslist";
import { resolveToEsbuildTarget } from "esbuild-plugin-browserslist";

export const root = path.resolve("wordpress-sync/app/public/wp-content/plugins/acme-corp-calculators");
export const esbuildConfig = {
  entryPoints: globbySync(`${root}/src/**/entry.tsx`),
  outdir: `${root}/dist`,
  bundle: true,
  format: "cjs",
  inject: ["./react-shim.js"],
  minify: false,
  sourcemap: true,
  target: resolveToEsbuildTarget(browserslist("> 0.5%, last 2 versions, not dead"), {
    printUnknownTargets: false,
  }),
};

export const ejsFiles = globbySync(`${root}/**/*.ejs`);

function getCalculatorFromPath(thisPath) {
  return thisPath.match(/\/src\/(.+?)\//)?.[1] || "";
}

export function compileEJSFileToDist(srcFilePath) {
  const template = ejs.compile(String(fs.readFileSync(srcFilePath)));

  const data = {
    root,
    calculators: esbuildConfig.entryPoints.map(getCalculatorFromPath),
    thisCalculator: getCalculatorFromPath(srcFilePath),
  };

  const distFilePath = srcFilePath.replace("/src/", "/dist/").replace(".ejs", "");
  const dirPath = path.dirname(distFilePath);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(distFilePath, template(data));
}

export function doBuild() {
  try {
    fs.unlinkSync(`${root}/dist`);
  } catch (e) {}

  build(esbuildConfig);
  ejsFiles.forEach((a) => compileEJSFileToDist(a));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  //Only execute the build on load if called directly.
  doBuild();
}
