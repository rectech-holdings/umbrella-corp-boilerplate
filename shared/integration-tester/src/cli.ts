import path from "path";
import chokidar from "chokidar";
import _ from "lodash";
import chalk from "chalk";
import { program } from "commander";
import { executeTestFile } from "./utils/executeTestFile.js";
import { Flag, Test } from "./runtime/types.js";

program
  .argument("[files...]", 'Space separated list of relative file globs. Defaults to "**/*.test.js"')
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
          const testManager = await executeTestFile(thisPath);
          const testsInFile = await testManager.onceHasAddedAllTests();
          await runTests([testsInFile], false);
        }
      });
    }

    await new Promise<void>((res, reject) => {
      watcher.on("ready", async function readyListener() {
        try {
          const dirObj = watcher.getWatched();
          const dirs = Object.keys(dirObj);
          if (!dirs.length) {
            console.error(chalk.red("No test files found! Aborting"));
            process.exit(1);
          }

          const files = _.flatten(dirs.map((dir) => dirObj[dir]!.map((file) => path.join(dir, file))));

          const testManagers = await Promise.all(files.map((file) => executeTestFile(file)));

          const tests = _.flatten(await Promise.all(testManagers.map((a) => a.onceHasAddedAllTests())));

          for (let i = 0; i < tests.length; i++) {
            await tests[i]!.fn();
          }

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

async function runTests(testsByFile: Test[][], showFinalSummary: boolean) {
  type Result = "fail" | "pass" | "todo" | "skip";
  const results: Result[] = [];
  await Promise.all(
    testsByFile.map(async (testsInFile) => {
      const [onlyTests, restTests] = _.partition(testsInFile, (t) => t.flag === "only");

      const testsToRun = onlyTests.length ? onlyTests : restTests;

      for (let i = 0; i < testsToRun.length; i++) {
        const test = testsToRun[i]!;
        const baseDescription = `${test.description.join("➜")}: `;
        let err: unknown;
        try {
          if (test.flag === "skip") {
            chalk.strikethrough.yellow();
          } else if (test.flag === "todo") {
          } else {
            await test.fn();
          }
        } catch (e) {
          err = e;
        }

        const didError = typeof err !== undefined;
        const str = baseDescription + (err ? "✖" : "✔️");
        console.info(didError ? chalk.red(str) : chalk.green(str));
        if (didError) {
          console.info(chalk.red(err instanceof Error && err["message"] ? err["message"] : err));
        }

        results.push(didError ? "fail" : "pass");
      }
    }),
  );

  if (showFinalSummary) {
    const resultsObj = Object.keys(_.countBy(results)) as any as { [res in Result]?: number };
    console.info("Passed:".padEnd(12), chalk.green(resultsObj.pass ?? 0));
    console.info("Failed:".padEnd(12), chalk.red(resultsObj.fail ?? 0));
    if (resultsObj.skip) {
      console.info("Skipped:".padEnd(12), chalk.yellow(resultsObj.fail ?? 0));
    }
  }
}
