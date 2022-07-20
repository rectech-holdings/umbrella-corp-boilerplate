import { createUrlGenerator, createPathsObject, createRouteDefinition, ParamTypes } from "rn-typed-router-core";

export const RN_APP_ROOT_ROUTE_DEFINITION = createRouteDefinition({
  type: "stack",
  routes: {
    withoutParams: {
      type: "leaf",
      Component: () => null,
    },
    qwer: {
      type: "leaf",
      Component: () => null,
      params: {
        qwer: ParamTypes.string().default("bloah"),
      },
    },
    bloop: {
      type: "tab",
      params: {
        bloop: ParamTypes.number().optional(),
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
              Component: () => null,
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
