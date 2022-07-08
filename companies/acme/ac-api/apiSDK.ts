import { createTypedReactSDK, QueryClient } from "create-typed-sdk";
import { publicConfig } from "./config/public";
import type * as api from "./endpoints";

export async function createApiSDK(queryClient: QueryClient) {
  return {
    ApiSDK: createTypedReactSDK<typeof api>({
      queryClient,
      url: (await publicConfig).url,
    }),
  };
}
