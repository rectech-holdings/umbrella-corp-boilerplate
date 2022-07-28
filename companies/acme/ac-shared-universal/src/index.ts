import {
  createUrlGenerator,
  createPathsObject,
  createRouteDefinition,
  ParamTypes,
  createNonUIRouteDefinition,
} from "rn-typed-router-core";

export const RN_APP_ROOT_ROUTE_DEFINITION = createNonUIRouteDefinition({
  type: "switch",
  routes: {
    LOGIN: {
      type: "leaf",
    },
    MAIN: {
      type: "tab",
      routes: {
        TAB_1: {
          type: "stack",
          routes: {
            TAB_1_STACK_HOME: {
              type: "leaf",
            },
            TAB_1_STACK_SCREEN: {
              type: "leaf",
              params: {
                someParam: ParamTypes.number(),
              },
            },
          },
        },
        TAB_2: {
          type: "leaf",
        },
      },
    },
  },
});

export const RN_APP_PATHS = createPathsObject(RN_APP_ROOT_ROUTE_DEFINITION);

export const RN_APP_URL_GENERATOR = createUrlGenerator(RN_APP_ROOT_ROUTE_DEFINITION);
