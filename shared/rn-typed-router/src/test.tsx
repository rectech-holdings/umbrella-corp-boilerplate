import { ParamTypes } from "./implementations/params.js";
import { createRouter, createRouteDefinition } from "./index.js";

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

const { Navigator, getCurrentParams, generateUrl, goBack, PATHS, useIsFocused, reset, navigate, useParams } =
  createRouter(routeDef, {});

generateUrl(PATHS.withoutParams, {});
generateUrl(PATHS.bloop.baz.burp, {
  baz: "qwer",
  burp: "",
});

generateUrl(PATHS.bloop.baz.burp, {
  ...getCurrentParams(PATHS.bloop.baz),
  burp: "qwer",
});

generateUrl(PATHS.bloop.baz.burp, {
  baz: "asdf",
  burp: "qwer",
});

navigate(PATHS.withoutParams, {});

function Blah() {
  const { baz, bloop } = useParams(PATHS.bloop.baz);
  const selectedVal = useParams(PATHS.bloop.baz, (a) => a.baz);
}
