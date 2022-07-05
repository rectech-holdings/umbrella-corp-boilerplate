import { PublicConfig } from "../types";

export const publicConfig: PublicConfig = new (class Blah {
  port = 3250;
  url = `http://localhost:${this.port}`;
})();
