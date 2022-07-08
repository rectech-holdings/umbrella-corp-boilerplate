import { PublicConfig } from "../types.js";
import { publicConfig as devPublicConfig } from "./public.development.js";

export const publicConfig: PublicConfig = {
  ...devPublicConfig,
  port: 80,
  url: "https://app.blah.com",
};
