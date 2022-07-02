import { createApiSDK } from "cy-api";
import { queryClient } from "./react-query.service";

export const { ApiSDK } = createApiSDK(queryClient);
