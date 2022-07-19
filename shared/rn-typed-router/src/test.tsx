import React from "react";
import {
  InferParamsInputObjAtPath,
  InferParamsOutputObjAtPath,
  ParamsInputObj,
  ParamTypes,
} from "./components/params.js";
import { GetSecretArrayPathFromPathObjResult, PathObjResult } from "./components/path.js";
import { createRouter, createRouteDefinition } from "./index.js";
import { ExtractObjectPath } from "./utils/typescriptHelpers.js";

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

type RouteDef = typeof routeDef;

const {
  Navigator,
  generateUrl,
  getCurrentlyFocusedUrl,
  goBack,
  navigation,
  subscribeToCurrentlyFocusedPath,
  useIsFocused,
  useOnFocusChange,
  useParams,
} = createRouter(routeDef, {});

// type asdasdf = InferParamsInputObjAtPath<ParamsInputObj<RouteDef>, PathObjResult<"bloop", "baz", "burp">>;
// type asdasdf2 = InferParamsOutputObjAtPath<ParamsInputObj<RouteDef>, PathObjResult<"bloop", "baz", "burp">>;

type qwerqwerd = ParamsInputObj<RouteDef>;

generateUrl((a) => a.bloop.baz.burp, {
  baaaz: "adf",
  bloop: "qwer",
});
