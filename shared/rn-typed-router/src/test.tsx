import React from "react";
import { ParamTypes } from "./components/params.js";
import { createRouter, createRouteDefinition } from "./index.js";

const routeDef = createRouteDefinition({
  type: "stack",
  routes: {
    qwer: {
      type: "leaf",
      Component: () => null,
      params: {
        first: ParamTypes.string().default("bloah"),
      },
    },
    bloop: {
      type: "tab",
      params: {
        bleep: ParamTypes.number().default(123),
      },
      routes: {
        baz: {
          type: "stack",
          params: {
            bloop: ParamTypes.enum({ asdf: true, qwer: true }),
          },
          routes: {
            burp: {
              type: "leaf",
              Component: () => null,
              params: {
                baaaz: ParamTypes.string(),
              },
            },
          },
        },
      },
    },
  },
});

const {
  Navigator,
  getCurrentlyFocusedPath,
  goBack,
  navigateToUrl,
  navigation,
  subscribeToCurrentlyFocusedPath,
  useIsFocused,
  useNavigationState,
  useOnFocusChange,
  useParams,
} = createRouter(routeDef, {});
