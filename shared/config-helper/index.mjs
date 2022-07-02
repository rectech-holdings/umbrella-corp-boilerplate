#!/usr/bin/env node
import { Command } from "commander";
import { createReadStream, createWriteStream, readdirSync } from "fs";
import chalk from "chalk";
import { globby } from "globby";
import { Encrypt, Decrypt } from "node-aescrypt";
import path from "path";

const program = new Command();

program.name("config-helper").description("CLI to make Umbrella Corp config easier");

program
  .command("encrypt")
  .description("encrypt files")
  .requiredOption(
    "-d, --directory <directory>",
    "Relative path to the directory (and its sub-directories) you wish to scan."
  )
  .requiredOption("-e, --env <env>", '"staging" or "production"')
  .requiredOption("-p, --password <password>", "Password used to encrypt")
  .option(
    "--pattern <pattern>",
    '(Optional) Pattern of file w/ single "*" for env placeholder. Defaults to "secret.*.ts"',
    "secret.*.ts"
  )
  .option("--suffix <suffix>", '(Optional) Encryption suffix to be added to file name. Defaults to ".aes"', ".aes")
  .action(async (options) => {
    const { env: environment, password, directory, pattern, suffix } = options;

    const dirPath = path.join(process.cwd(), directory);
    const filePattern = pattern.replace("*", environment);

    const files = await globby(`${dirPath}/**/${filePattern}`, { ignore: ["node_modules"], absolute: true });

    if (!files.length) {
      console.error(chalk.red(`Aborting! No files of pattern "${pattern}" found in directory ${dirPath}!`));
      process.exitCode = 1;
      return;
    }

    await Promise.all(
      files.map(async (filePath) => {
        const from = createReadStream(filePath);
        const to = createWriteStream(filePath + suffix);
        const through = new Encrypt(password);

        await new Promise((res, rej) => {
          from
            .pipe(through)
            .pipe(to)
            .on("error", (e) => rej(e))
            .on("finish", () => res());
        });
      })
    );

    console.info(`Successfully encrypted ${files.length} files...`);
  });

program
  .command("decrypt")
  .description("decrypt files")
  .requiredOption(
    "-d, --directory <directory>",
    "Relative path to the directory (and its sub-directories) you wish to scan."
  )
  .requiredOption("-e, --env <env>", '"staging" or "production"')
  .requiredOption("-p, --password <password>", "Password used to decrypt")
  .option(
    "--pattern <pattern>",
    '(Optional) Pattern of file w/ single "*" for env placeholder. Defaults to "secret.*.ts.aes"',
    "secret.*.ts.aes"
  )
  .option("--suffix <suffix>", '(Optional) Encryption suffix to be removed from file name. Defaults to ".aes"', ".aes")
  .action(async (options) => {
    const { env: environment, password, directory, pattern, suffix } = options;

    const dirPath = path.join(process.cwd(), directory);
    const filePattern = pattern.replace("*", environment);

    const files = await globby(`${dirPath}/**/${filePattern}`, { ignore: ["node_modules"], absolute: true });

    if (!files.length) {
      console.error(chalk.red(`Aborting! No files of pattern "${pattern}" found in directory ${dirPath}!`));
      process.exitCode = 1;
      return;
    }

    await Promise.all(
      files.map(async (filePath) => {
        const from = createReadStream(filePath);
        const to = createWriteStream(filePath.replace(suffix, ""));
        const through = new Decrypt(password);

        await new Promise((res, rej) => {
          from
            .pipe(through)
            .pipe(to)
            .on("error", (e) => rej(e))
            .on("finish", () => res());
        });
      })
    );
    console.info(`Successfully decrypted ${files.length} files...`);
  });

program.parse();
