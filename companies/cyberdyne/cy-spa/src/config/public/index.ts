import { PublicConfig } from "../types";

const CONFIG_ENV = process.env["CONFIG_ENV"];

export const publicConfig = (async () => {
  let conf: PublicConfig;
  if (CONFIG_ENV === "production") {
    conf = (await import("./public.production")).publicConfig;
  } else if (CONFIG_ENV === "staging") {
    conf = (await import("./public.staging")).publicConfig;
  } else if (CONFIG_ENV === "development" || !CONFIG_ENV) {
    conf = (await import("./public.development")).publicConfig;
  } else {
    throw new Error(`No config found for CONFIG_ENV "${CONFIG_ENV}"!`);
  }
  return conf;
})();
