import {
  createUrlGenerator,
  createPathsObject,
  createRouteDefinition,
  ParamTypes,
  createNonUIRouteDefinition,
} from "rn-typed-router-core";

export const RN_APP_ROOT_ROUTE_DEFINITION = createNonUIRouteDefinition({
  type: "stack",
  routes: {
    withoutParams: {
      type: "leaf",
    },
    qwer: {
      type: "leaf",
      params: {
        qwer: ParamTypes.string().default("bloah"),
      },
    },
    bloop: {
      type: "tab",
      params: {
        bloop: ParamTypes.number().default(1234),
      },
      routes: {
        baz: {
          type: "stack",
          params: {
            baz: ParamTypes.enum({ asdf: true, qwer: true }),
          },
          routes: {
            burp: {
              type: "leaf",
              params: {
                burp: ParamTypes.string(),
              },
            },
          },
        },
      },
    },
  },
});

export const RN_APP_PATHS = createPathsObject(RN_APP_ROOT_ROUTE_DEFINITION);

export const RN_APP_URL_GENERATOR = createUrlGenerator(RN_APP_ROOT_ROUTE_DEFINITION);
