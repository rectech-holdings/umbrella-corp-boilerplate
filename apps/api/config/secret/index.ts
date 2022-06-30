import { SecretConfig } from "../types";

const configFilePath = `./secret.${process.env["CONFIG_ENV"] || "development"}.ts`;

export const secretConfig: Promise<SecretConfig> = import(configFilePath);
