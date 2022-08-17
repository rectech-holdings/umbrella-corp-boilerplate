import {
  createUrlGenerator,
  createPathsObject,
  createRouteDefinition,
  ParamTypes,
  createNonUIRouteDefinition,
} from "react-typed-navigator-core";

export const RN_APP_ROOT_ROUTE_DEFINITION = createNonUIRouteDefinition({
  type: "switch",
  routes: {
    login: {
      type: "leaf",
    },
    main: {
      type: "switch",
      routes: {
        tab_1: {
          type: "stack",
          routes: {
            tab_1_stack_home: {
              type: "leaf",
            },
            tab_1_stack_screen: {
              type: "leaf",
              params: {
                someParam: ParamTypes.number(),
              },
            },
          },
        },
        tab_2: {
          type: "leaf",
        },
      },
    },
  },
});

export const RN_APP_PATHS = createPathsObject(RN_APP_ROOT_ROUTE_DEFINITION);

export const RN_APP_URL_GENERATOR = createUrlGenerator(RN_APP_ROOT_ROUTE_DEFINITION);
