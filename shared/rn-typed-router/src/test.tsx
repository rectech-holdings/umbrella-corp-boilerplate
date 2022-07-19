import React from "react";
import { $paramsType, ParamsInputObj, ParamsOutputObj, ParamTypes } from "./components/params.js";
import { $pathType, PathObjResult, PathObjResultLeaf } from "./components/path.js";
import { RouteDef } from "./components/routes.js";
import { createRouter, createRouteDefinition } from "./index.js";
import { ExtractObjectPath } from "./utils/typescriptHelpers.js";

const routeDef = createRouteDefinition({
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

type thisRouteDef = typeof routeDef;

const {
  Navigator,
  generateUrl,
  getCurrentlyFocusedUrl,
  goBack,
  paths,
  navigation,
  subscribeToCurrentlyFocusedPath,
  useIsFocused,
  goTo,
  useOnFocusChange,
  useParams,
} = createRouter(routeDef, {});

generateUrl(paths.withoutParams, {});
generateUrl(paths.bloop.baz.burp, {
  baz: "qwer",
  burp: "",
});

goTo(paths.withoutParams, {});

function Blah() {
  const { baz, bloop } = useParams(paths.bloop.baz);
}
