import { createTypedReactSDK, QueryClient } from "create-typed-sdk";
import { publicConfig } from "./config/public/index.js";
import type * as api from "./endpoints/index.js";

export async function createApiSDK(queryClient: QueryClient) {
  return {
    ApiSDK: createTypedReactSDK<typeof api>({
      queryClient,
      url: (await publicConfig).url,
    }),
  };
}
