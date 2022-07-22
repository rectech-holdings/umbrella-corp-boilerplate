// import { ParamTypes, ParamTypesClass } from "./implementations/params.js";
// import { createRouter, createRouteDefinition } from "./index.js";
// import { InnerNavigationState, NavigateOptions, RootNavigationState } from "./types/navigationState.js";
// import { createZustandStore } from "./utils/createZustandStore.js";

// const routeDef = createRouteDefinition({
//   type: "switch",
//   routes: {
//     withoutParams: {
//       type: "leaf",
//       Component: () => null,
//     },
//     qwer: {
//       type: "leaf",
//       Component: () => null,
//       params: {
//         qwer: ParamTypes.string().default("bloah"),
//       },
//     },
//     bloop: {
//       type: "tab",
//       params: {
//         bloop: ParamTypes.number().optional(),
//       },
//       routes: {
//         blerp: {
//           type: "leaf",
//           Component: () => null,
//         },
//         baz: {
//           type: "stack",
//           params: {
//             baz: ParamTypes.enum({ asdf: true, qwer: true }),
//           },
//           routes: {
//             burp: {
//               type: "leaf",
//               Component: () => null,
//               params: {
//                 burp: ParamTypes.string(),
//               },
//             },
//           },
//         },
//       },
//     },
//   },
// });

// type thisRouteDef = typeof routeDef;

// const { Navigator, getFocusedParams, generateUrl, goBack, PATHS, useIsFocused, reset, navigate, useParams } =
//   createRouter(routeDef, {});

// const navState: RootNavigationState<thisRouteDef> = {
//   type: "root-switch",
//   focusedTabIndex: 1,
//   tabs: [
//     {
//       path: "withoutParams",
//       type: "leaf",
//     },
//     {
//       path: "qwer",
//       type: "leaf",
//       params: {
//         qwer: "asdfasdf",
//       },
//     },
//     {
//       path: "bloop",
//       type: "tab",
//       focusedTabIndex: 0,
//       params: {
//         bloop: 123,
//       },
//       tabs: [
//         {
//           path: "baz",
//           type: "stack",
//           params: {
//             baz: "qwer",
//           },
//           stack: [
//             {
//               path: "burp",
//               type: "leaf",
//               params: {
//                 burp: "asdfasdrewr",
//               },
//             },
//           ],
//         },
//       ],
//     },
//   ],
// };

// generateUrl(PATHS.withoutParams, {});
// generateUrl(PATHS.bloop.baz.burp, {
//   baz: "qwer",
//   burp: "",
// });

// generateUrl(PATHS.bloop.baz.burp, {
//   ...getFocusedParams(PATHS.bloop.baz),
//   burp: "qwer",
// });

// generateUrl(PATHS.bloop.baz.burp, {
//   baz: "asdf",
//   burp: "qwer",
// });

// navigate(PATHS.withoutParams, {});

// function Blah() {
//   const { baz, bloop } = useParams(PATHS.bloop.baz);
//   const selectedVal = useParams(PATHS.bloop.baz, (a) => a.baz);
// }
