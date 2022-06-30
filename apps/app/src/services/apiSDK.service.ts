import { createApiSDK } from "@acme-corp/api";
import { queryClient } from "./react-query.service";

export const { ApiSDK } = createApiSDK(queryClient);
