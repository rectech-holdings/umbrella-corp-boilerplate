import { createApiSDK } from "@umbrella-corp/acme-api";
import { queryClient } from "./react-query.service";

export const { ApiSDK } = createApiSDK(queryClient);
