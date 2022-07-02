import { createApiSDK } from "ac-api";
import { queryClient } from "./react-query.service";

export const { ApiSDK } = createApiSDK(queryClient);
