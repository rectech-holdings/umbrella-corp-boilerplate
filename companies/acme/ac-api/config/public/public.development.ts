import { PublicConfig } from "../types";

export const publicConfig: PublicConfig = {
  port: 3300,
  get url() {
    return `http://localhost:${publicConfig.port}`;
  },
};
