import { createTypedSDK } from "create-typed-sdk";
import { createTypedReactSDK } from "create-typed-react-sdk";
import { publicConfig } from "./config/public/index.js";
import type * as api from "./endpoints/index.js";

export function createApiReactSDK() {
  return {
    ApiSDK: createTypedReactSDK<typeof api>({
      url: publicConfig.url,
    }),
  };
}

export function createApiSDK() {
  return {
    ApiSDK: createTypedSDK<typeof api>({
      url: publicConfig.url,
    }),
  };
}
