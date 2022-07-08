import { PublicConfig } from "../types.js";

export const publicConfig: PublicConfig = new (class ThisConfig {
  port = 3250;
  url = `http://localhost:${this.port}`;
})();
