import { RN_APP_ROOT_ROUTE_DEFINITION } from "ac-shared-universal";

import { createRouter, lazy, createExtendingRouteDefinition, ParamTypes } from "react-typed-navigator";

const routeDef = createExtendingRouteDefinition(RN_APP_ROOT_ROUTE_DEFINITION, {
  type: "switch",
  initialRoute: "main",
  ErrorHandler(p) {
    return null;
  },
  NotFoundHandler(p) {
    return null;
  },
  routes: {
    login: {
      type: "leaf",
      Component: lazy(() => import("./pages/Login.js")),
    },
    main: {
      type: "switch",
      keepChildrenMounted: true,
      Footer: lazy(() => import("./pages/MainTabBar.js")),
      routes: {
        tab_1: {
          type: "stack",
          routes: {
            tab_1_stack_home: {
              type: "leaf",
              Component: lazy(() => import("./pages/Tab1StackHome.js")),
            },
            tab_1_stack_screen: {
              type: "leaf",
              Component: lazy(() => import("./pages/Tab1StackScreen.js")),
              params: {
                someParam: ParamTypes.number(),
              },
            },
          },
        },
        tab_2: {
          type: "leaf",
          Component: lazy(() => import("./pages/Tab2.js")),
        },
      },
    },
  },
} as const);

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
