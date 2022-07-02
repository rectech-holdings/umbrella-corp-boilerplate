import { PublicConfig } from "../types";

import { publicConfig as devPublicConfig } from "./public.development";

export const publicConfig: PublicConfig = {
  ...devPublicConfig,
  blah: "asdf",
};
