import { RN_APP_ROOT_ROUTE_DEFINITION } from "ac-shared-universal";

import { createRouter } from "rn-typed-router";

export const {
  Navigator,
  PATHS,
  generateUrl,
  getCurrentParams,
  getCurrentUrl,
  getUntypedCurrentParams,
  goBack,
  navigate,
  navigateToUrl,
  reset,
  subscribeToCurrentUrl,
  useCurrentUrl,
  useFocusEffect,
  useIsFocused,
  useParams,
  useUntypedParams,
} = createRouter(RN_APP_ROOT_ROUTE_DEFINITION);
