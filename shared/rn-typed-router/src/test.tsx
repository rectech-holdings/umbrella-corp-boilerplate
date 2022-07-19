import React from "react";
import { ParamsInputObj, ParamTypes } from "./components/params.js";
import { createRouter, createRouteDefinition } from "./index.js";
import { ExtractObjectPath } from "./utils/typescriptHelpers.js";

const routeDef = createRouteDefinition({
  type: "stack",
  routes: {
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

type RouteDef = typeof routeDef;

const {
  Navigator,
  generateUrl,
  getCurrentlyFocusedUrl,
  goBack,
  paths,
  navigation,
  subscribeToCurrentlyFocusedPath,
  useIsFocused,
  useOnFocusChange,
  useParams,
} = createRouter(routeDef, {});

generateUrl(paths.bloop.baz, {
  baz: "asdf",
  bloop: 123,
});

generateUrl(paths.bloop.baz.burp, {
  baz: "asdf",
  bloop: 123,
  burp: "asdf",
});

function Blah() {
  const asdf = useParams(paths.bloop.baz.burp);
}
