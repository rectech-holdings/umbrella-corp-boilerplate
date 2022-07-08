import { createTypedReactSDK } from "create-typed-sdk";
import axios from "axios";
import type { ApiType } from "./server-api.js";
import { QueryClient } from "react-query";

export function createServerSDK(queryClient: QueryClient) {
  return createTypedReactSDK<ApiType>({
    queryClient: queryClient as any,
    doFetch: async ({ argument, path }) => {
      return axios.post(`http://localhost:8000/${path.join("/")}`, { argument }).then((resp) => resp.data);
    },
  });
}
