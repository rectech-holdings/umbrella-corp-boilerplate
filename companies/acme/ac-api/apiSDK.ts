import { createTypedReactSDK, QueryClient } from "create-typed-sdk";
import * as api from "./endpoints";

export function createApiSDK(queryClient: QueryClient) {
  return {
    ApiSDK: createTypedReactSDK<typeof api>({
      queryClient,
      url: "http://localhost:3300",
    }),
  };
}
