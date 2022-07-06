import { PublicConfig } from "../types";
import { publicConfig as devPublicConfig } from "./public.development";

export const publicConfig: PublicConfig = {
  ...devPublicConfig,
  port: 80,
  url: "https://app.blah.com",
};
