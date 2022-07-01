#!/usr/bin/env node

import { createReadStream, createWriteStream, readdirSync } from "fs";
import { readFile } from "fs/promises";
import { Encrypt, Decrypt } from "node-aescrypt";
import path from "path";

const command = process.argv[2];

if (command !== "encrypt" && command !== "decrypt") {
  throw new Error(
    "Must specify 'encrypt' or 'decrypt' to secrets-helper as first parameter. E.g. \"yarn secrets encrypt staging password\""
  );
}

const environment = process.argv[3];

if (!environment) {
  const msg = `Environment must be defined as second parameter. E.g. "yarn secrets encrypt staging password"`;
  throw new Error(msg);
}

if (environment === "development") {
  const msg = `\"development\" is not a valid environment! Development secrets should be checked in for now.`;
  throw new Error(msg);
}

const password = process.argv[4];

if (!password) {
  const msg = `Password must be defined as third parameter. E.g. \"yarn secrets encrypt staging password\"`;
  throw new Error(msg);
}

const dirPath = path.join(process.cwd(), "./config/secret");

if (command === "encrypt") {
  const filePath = path.join(dirPath, `secret.${environment}.ts`);
  const fileToEncrypt = await readFile(filePath).catch(() => {});

  if (!fileToEncrypt) {
    const options = readdirSync(dirPath)
      .map((a) => a.match(/secret\.(.+?)\.ts$/)?.[1])
      .filter((a) => a)
      .filter((a) => a !== "development")
      .map((a) => `"${a}"`)
      .join(" and ");

    const msg = `Unable to find secret file for environment "${environment}". Available environments are ${options}`;
    throw new Error(msg);
  }

  const from = createReadStream(filePath);
  const to = createWriteStream(filePath + ".aes");
  const through = new Encrypt(password);

  await new Promise((res, rej) => {
    from
      .pipe(through)
      .pipe(to)
      .on("error", (e) => rej(e))
      .on("finish", () => res());
  });
} else if (command === "decrypt") {
  const filePath = path.join(dirPath, `secret.${environment}.ts.aes`);
  const fileToDecrypt = await readFile(filePath).catch(() => {});

  if (!fileToDecrypt) {
    throw new Error(`Cannot find file ${filePath}. Did you specify the correct environment?`);
  }

  const from = createReadStream(filePath);
  const to = createWriteStream(filePath.replace(".aes", ""));
  const through = new Decrypt(password);

  await new Promise((res, rej) => {
    from
      .pipe(through)
      .pipe(to)
      .on("error", (e) => rej(e))
      .on("finish", () => res());
  });
}
