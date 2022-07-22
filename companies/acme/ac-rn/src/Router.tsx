import { RN_APP_ROOT_ROUTE_DEFINITION } from "ac-shared-universal";

import { createRouter, extendNonUIRouteDefinition, ParamTypes } from "rn-typed-router";

const routeDef = extendNonUIRouteDefinition(RN_APP_ROOT_ROUTE_DEFINITION, {
  type: "stack",
  routes: {
    bloop: {
      type: "tab",
      routes: {
        baz: {
          type: "stack",
          routes: {
            burp: {
              type: "leaf",
              getComponent: () => () => null,
            },
          },
        },
      },
    },
    qwer: {
      type: "leaf",
      getComponent: () => () => null,
    },
    withoutParams: {
      type: "leaf",
      getComponent: () => () => null,
    },
  },
});

export const {
  Navigator,
  PATHS,
  generateUrl,
  goBack,
  navigate,
  navigateToUrl,
  reset,
  useFocusEffect,
  useIsFocused,
  useParams,
  getFocusedParams,
  getFocusedUrl,
  subscribeToFocusedUrl,
  useFocusedUrl,
  validateUrl,
} = createRouter(routeDef);

navigate(PATHS.qwer, { qwer: "asdf" });
