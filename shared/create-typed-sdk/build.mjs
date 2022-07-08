import esbuild from "esbuild";
import yargs from "yargs-parser";
const { _, ...argv } = yargs(process.argv.slice(2)) || {};

const conf = {
  entryPoints: ["./src/index.ts", "./src/core/index.ts"],
  bundle: true,
  format: "cjs",
  minify: false,
  sourcemap: true,
  external: ["react-query", "fast-safe-stringify", "axios"],
  ...argv,
};

esbuild.build(conf);
