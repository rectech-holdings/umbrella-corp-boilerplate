import { PublicConfig } from "../types";

const configFilePath = `./public.${process.env["CONFIG_ENV"] || "development"}.ts`;

export const publicConfig: Promise<PublicConfig> = import(configFilePath);
