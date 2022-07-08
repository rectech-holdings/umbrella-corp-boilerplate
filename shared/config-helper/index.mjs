#!/usr/bin/env node
import { Command } from "commander";
import os from "os";
import fs from "fs";
import { createReadStream, createWriteStream, readdirSync } from "fs";
import chalk from "chalk";
import { globby } from "globby";
import { Encrypt, Decrypt } from "node-aescrypt";
import path from "path";
import esbuild from "esbuild";

const program = new Command();

const allowedEnvs = ["staging", "production"];

program.name("config-helper").description("CLI to make Umbrella Corp config easier");

program
  .command("encrypt")
  .description("encrypt files")
  .requiredOption(
    "-d, --directory <directory>",
    "Relative path to the directory (and its sub-directories) you wish to scan.",
  )
  .requiredOption("-e, --env <env>", '"staging" or "production"')
  .requiredOption("-p, --password <password>", "Password used to encrypt")
  .option(
    "--pattern <pattern>",
    '(Optional) Pattern of file w/ single "*" for env placeholder. Defaults to "secret.*.ts"',
    "secret.*.ts",
  )
  .option("--suffix <suffix>", '(Optional) Encryption suffix to be added to file name. Defaults to ".aes"', ".aes")
  .action(async (options) => {
    const { env: environment, password, directory, pattern, suffix } = options;

    if (!allowedEnvs.includes(environment)) {
      process.exitCode = 1;
      console.error(
        chalk.red(`Invalid environment "${environment}". Available options are: ${allowedEnvs.join(" OR ")}`),
      );
      return;
    }

    const dirPath = path.join(process.cwd(), directory);
    const filePattern = pattern.replace("*", environment);

    const files = await globby(`${dirPath}/**/${filePattern}`, { ignore: "**/node_modules/**", absolute: true });

    if (!files.length) {
      console.error(chalk.red(`Aborting! No files of pattern "${pattern}" found in directory ${dirPath}!`));
      process.exitCode = 1;
      return;
    }

    await Promise.all(
      files.map(async (readPath) => {
        const writePath = readPath + suffix;
        const from = createReadStream(readPath);
        const to = createWriteStream(writePath);
        const through = new Encrypt(password);

        await new Promise((res, rej) => {
          from
            .pipe(through)
            .pipe(to)
            .on("error", (e) => rej(e))
            .on("finish", () => res());
        });
      }),
    );

    console.info(`Success encrypting ${files.length} files!`);
  });

program
  .command("decrypt")
  .description("decrypt files")
  .requiredOption(
    "-d, --directory <directory>",
    "Relative path to the directory (and its sub-directories) you wish to scan.",
  )
  .requiredOption("-e, --env <env>", '"staging" or "production"')
  .requiredOption("-p, --password <password>", "Password used to decrypt")
  .option(
    "--pattern <pattern>",
    '(Optional) Pattern of file w/ single "*" for env placeholder. Defaults to "secret.*.ts.aes"',
    "secret.*.ts.aes",
  )
  .option("--suffix <suffix>", '(Optional) Encryption suffix to be removed from file name. Defaults to ".aes"', ".aes")
  .action(async (options) => {
    const { env: environment, password, directory, pattern, suffix } = options;

    const dirPath = path.join(process.cwd(), directory);
    const filePattern = pattern.replace("*", environment);

    const files = await globby(`${dirPath}/**/${filePattern}`, { ignore: "**/node_modules/**", absolute: true });

    if (!files.length) {
      console.error(chalk.red(`Aborting! No files of pattern "${pattern}" found in directory ${dirPath}!`));
      process.exitCode = 1;
      return;
    }

    await Promise.all(
      files.map(async (readPath) => {
        const writePath = readPath.replace(suffix, "");
        const from = createReadStream(readPath);
        const to = createWriteStream(writePath);
        const through = new Decrypt(password);

        await new Promise((res, rej) => {
          from
            .pipe(through)
            .pipe(to)
            .on("error", (e) => rej(e))
            .on("finish", () => res());
        });
      }),
    );
    console.info(`Success decrypting ${files.length} files!`);
  });

program
  .command("print-public")
  .description(
    "Prints all public config. This is typically so that it can be easily sourced into the running bash process",
  )
  .option("-p, --path <path>", 'Relative path to the public config file. Defaults to "config/public/index.ts"')
  .option("-e, --export <export>", 'Named export to read inside the config file. Defaults to "publicConfig"')
  .action(async (options) => {
    const readPath = path.join(process.cwd(), options.path || "config/public/index.ts");
    if (!fs.existsSync(readPath)) {
      const msg = `Unable to find ${readPath}! Aborting`;
      throw new Error(msg);
    }

    const writePath = path.join(os.tmpdir(), Math.random() * Math.random() + ".mjs");
    const res = await esbuild.build({
      entryPoints: [readPath],
      outfile: writePath,
      bundle: true,
      target: "esnext",
      format: "esm",
    });

    if (res.errors.length) {
      throw new Error("Error compiling config! Output from esbuild follows:\n" + JSON.stringify(res.errors, null, 2));
    }

    const envMap = (await import(writePath))[options.export || "publicConfig"];

    console.info(
      Object.keys(envMap)
        .map((k) => `${k}="${envMap[k]}";`)
        .join(" "),
    );
  });

program.parse();
