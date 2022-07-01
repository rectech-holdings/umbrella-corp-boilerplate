import { createApiSDK } from "@umbrella-corp/cyberdyne-api";
import { queryClient } from "./react-query.service";

export const { ApiSDK } = createApiSDK(queryClient);
