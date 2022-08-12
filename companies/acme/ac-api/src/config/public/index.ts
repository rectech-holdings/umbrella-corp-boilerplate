import { PublicConfig } from "../types.js";

const CONFIG_ENV = process.env["CONFIG_ENV"];

export async function getPublicConfig() {
  let conf: PublicConfig;
  if (CONFIG_ENV === "production") {
    conf = (await import("./public.production.js")).publicConfig;
  } else if (CONFIG_ENV === "staging") {
    conf = (await import("./public.staging.js")).publicConfig;
  } else if (CONFIG_ENV === "development" || !CONFIG_ENV) {
    conf = (await import("./public.development.js")).publicConfig;
  } else {
    throw new Error(`No config found for CONFIG_ENV "${CONFIG_ENV}"!`);
  }
  return conf;
}
