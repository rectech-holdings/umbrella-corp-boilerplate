import { SecretConfig } from "../types";

const env = process.env["CONFIG_ENV"] || "development";

try {
  var config = import(`./secret.${env}.ts`);
} catch (e) {
  throw new Error(
    `Unable to import secrets for CONFIG_ENV ${env}. Have you decrypted? At project root, try executing \`yarn decrypt ${env} PASSWORD_TO_BE_ENTERED\``
  );
}

export const secretConfig: Promise<SecretConfig> = config;
