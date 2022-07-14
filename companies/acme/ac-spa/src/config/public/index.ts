import { PublicConfig } from "../types.js";

let CONFIG_ENV = "";
if (typeof require === "undefined") {
  //@ts-ignore
  CONFIG_ENV = window.VITE_CONFIG_ENV;
} else {
  //@ts-ignore
  CONFIG_ENV = process.env.VITE_CONFIG_ENV || "";
}

console.log({ CONFIG_ENV });

export const publicConfig = (async () => {
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
})();
