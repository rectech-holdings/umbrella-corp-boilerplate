import { createTypedSDK } from "create-typed-sdk";
import { createTypedReactSDK, ReactSDKOptions } from "create-typed-react-sdk";
import { publicConfig } from "./config/public/index.js";
import type * as api from "./endpoints/index.js";

export function createApiReactSDK(opts?: Omit<ReactSDKOptions, "url" | "doFetch">) {
  return createTypedReactSDK<typeof api>({
    url: publicConfig.url,
    ...(opts || {}),
  });
}

export function createApiSDK() {
  return createTypedSDK<typeof api>({
    url: publicConfig.url,
  });
}
