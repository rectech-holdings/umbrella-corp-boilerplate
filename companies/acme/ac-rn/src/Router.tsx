import { RN_APP_ROOT_ROUTE_DEFINITION } from "ac-shared-universal";

import { createRouter, extendNonUIRouteDefinition, lazy } from "rn-typed-router";

const routeDef = extendNonUIRouteDefinition(RN_APP_ROOT_ROUTE_DEFINITION, {
  type: "switch",
  routes: {
    LOGIN: {
      type: "leaf",
      Component: lazy(() => import("./pages/Login.js")),
    },
    MAIN: {
      type: "tab",
      BottomTabBar: lazy(() => import("./pages/MainTabBar.js")),
      routes: {
        TAB_1: {
          type: "stack",
          routes: {
            TAB_1_STACK_HOME: {
              type: "leaf",
              Component: lazy(() => import("./pages/Tab1StackHome.js")),
            },
            TAB_1_STACK_SCREEN: {
              type: "leaf",
              Component: lazy(() => import("./pages/Tab1StackScreen.js")),
            },
          },
        },
        TAB_2: {
          type: "leaf",
          Component: lazy(() => import("./pages/Tab2.js")),
        },
      },
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
} = createRouter<typeof routeDef>(routeDef);
