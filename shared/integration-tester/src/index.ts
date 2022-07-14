import path from "path";
import chokidar from "chokidar";
import _ from "lodash";
import { program } from "commander";
import { executeModule } from "./utils/executeModule.js";

program
  .argument("[files...]", 'Relative file globs to test. Defaults to "**/*.test.js"')
  .option("-w, --watch", "Watch for changes")
  .option("--rootDir", "The directory to scan for test files")
  .action(async (fileGlobs: string[], options: { watch?: boolean; rootDir?: string }) => {
    if (fileGlobs.length === 0) {
      fileGlobs = ["**/*.test.js"];
    }

    const watcher = chokidar.watch(
      fileGlobs.map((a) => path.resolve(options.rootDir || process.cwd(), a)),
      {
        persistent: true,
        followSymlinks: false,
        ignored: ["node_modules"],
        cwd: process.cwd(),
        ignoreInitial: true,
      },
    );

    if (options.watch) {
      watcher.on("all", async (a, thisPath) => {
        if (a === "add" || a === "change") {
          executeTestFile(thisPath);
        }
      });
    }

    await new Promise<void>((res, reject) => {
      watcher.on("ready", async function readyListener() {
        try {
          const dirObj = watcher.getWatched();
          const dirs = Object.keys(dirObj);
          if (!dirs.length) {
            reject(new Error("No test files found! Aborting"));
            return;
          }

          const files = _.flatten(dirs.map((dir) => dirObj[dir]!.map((file: string) => path.join(dir, file))));

          await Promise.all(files.map((file) => executeTestFile(file)));

          if (!options.watch) {
            await watcher.close();
          }

          res();
        } catch (e) {
          reject(e);
        } finally {
          watcher.off("ready", readyListener);
        }
      });
    });
  })
  .parse();

function executeTestFile(relPath: string) {
  executeModule(process.cwd() + "/" + relPath).then(
    (res) => {
      console.info(res);
    },
    (err) => {
      console.error(err);
    },
  );
}
