import { createTypedSDK } from "create-typed-sdk";
import { createTypedReactSDK } from "create-typed-react-sdk";
import { publicConfig } from "./config/public/index.js";
import type * as api from "./endpoints/index.js";

export function createApiReactSDK() {
  return createTypedReactSDK<typeof api, "acme">({
    namespace: "acme",
    url: publicConfig.url,
  });
}

export function createApiSDK() {
  return createTypedSDK<typeof api>({
    url: publicConfig.url,
  });
}
