import { PublicConfig } from "../types";

import { publicConfig as devPublicConfig } from "./public.development";

export const publicConfig: PublicConfig = new (class Blah {
  port = 80;
  url = `https://blah.com:${this.port}`;
})();
