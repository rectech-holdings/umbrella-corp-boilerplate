import { PublicConfig } from "../types.js";

export const publicConfig: PublicConfig = new (class Blah {
  port = 80;
  url = `https://blah.com:${this.port}`;
})();
