import { PublicConfig } from "../types.js";

export const publicConfig: PublicConfig = {
  port: 3300,
  get url() {
    return `http://localhost:${publicConfig.port}`;
  },
};
