import React from "react";
import {
  InferParamsInputObjAtPath,
  InferParamsOutputObjAtPath,
  ParamsInputObj,
  ParamTypes,
} from "./components/params.js";
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
        bloop: ParamTypes.number().default(123),
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
});

// type asdasdf = InferParamsInputObjAtPath<ParamsInputObj<RouteDef>, PathObjResult<"bloop", "baz", "burp">>;
// type asdasdf2 = InferParamsOutputObjAtPath<ParamsInputObj<RouteDef>, PathObjResult<"bloop", "baz", "burp">>;

type qwerqwerd = ParamsInputObj<RouteDef>;
