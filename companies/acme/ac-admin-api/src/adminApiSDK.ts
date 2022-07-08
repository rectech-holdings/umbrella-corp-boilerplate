import { createTypedReactSDK, QueryClient } from "create-typed-sdk";
import type { APIType } from "./api.js";

export function createAdminApiSDK(queryClient: QueryClient) {
  return {
    AdminApiSDK: createTypedReactSDK<APIType>({
      queryClient,
      url: "http://localhost:3250",
    }),
  };
}