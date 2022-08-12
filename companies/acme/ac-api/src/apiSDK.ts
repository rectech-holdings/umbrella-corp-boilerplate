import { createTypedSDK } from "create-typed-sdk";
import { createTypedReactSDK, ReactSDKOptions } from "create-typed-react-sdk";
import { getPublicConfig } from "./config/public/index.js";
import type * as api from "./endpoints/index.js";

export async function createApiReactSDK(opts?: Omit<ReactSDKOptions, "url" | "doFetch">) {
  return createTypedReactSDK<typeof api>({
    url: (await getPublicConfig()).url,
    ...(opts || {}),
  });
}

export async function createApiSDK() {
  return createTypedSDK<typeof api>({
    url: (await getPublicConfig()).url,
  });
}
