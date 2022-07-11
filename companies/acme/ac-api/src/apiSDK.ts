import { createTypedReactSDK, QueryClient, createTypedSDK } from "create-typed-sdk";
import { publicConfig } from "./config/public/index.js";
import type * as api from "./endpoints/index.js";

export async function createApiReactSDK(queryClient: QueryClient) {
  return {
    ApiSDK: createTypedReactSDK<typeof api>({
      queryClient,
      url: (await publicConfig).url,
    }),
  };
}

export async function createApiSDK() {
  return {
    ApiSDK: createTypedSDK<typeof api>({
      url: (await publicConfig).url,
    }),
  };
}
